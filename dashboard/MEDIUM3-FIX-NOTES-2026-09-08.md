# MEDIUM batch 3 — pitch state machine + error-state UI (2026-09-08)

Four verified MEDIUM issues. Source edits only. **Not deployed.** No worker
scripts run, no live Blob touched, no production data mutated, no creds rotated.

Verification (in order):

1. `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **exit 0**
2. `npm run build` → **exit 0** (`✓ Compiled successfully`; the two Turbopack
   "dynamic filesystem access" warnings + the workspace-root warning are
   pre-existing and unrelated).

Files touched (7):

| File | Change |
| --- | --- |
| `src/lib/data.ts` | Canonical status union (legacy `pending`/`conditional` demoted to read-only); `reviewFeedback.revisionHash?`; new `hasReviewablePitch()`; `getWorkInbox` agent-work selector now includes pitch `rework`. |
| `src/app/api/pipeline/approve/route.ts` | Canonical pitch vocabulary end-to-end; legacy `pending`→`pending-review`, `conditional`→`rework` remap **before** any write; feedback retained on bare status flips until the body hash changes. |
| `src/app/approvals/page.tsx` | Resubmit posts canonical `pending-review`; approve/reject/resubmit now check HTTP **and** `ok`, render the server error inline, keep the reject form open on failure, and refresh the exact company on success (card leaves the queue on its own). |
| `src/components/client-workstation.tsx` | Demo-build eligibility rendered independently of pitch presence; status-only pitch stub no longer hides "Build demo". |
| `src/components/client-approval-panel.tsx` | `hasPitch` = `hasReviewablePitch(company)` (non-blank body required). |
| `src/app/api/approve-combined/route.ts` | `isReviewablePitch()` gates the email gate + `hadPitch`; per-scope validation for `scope:"pitch"` / `scope:"demo"`. |
| `src/app/demos/page.tsx` | Loader checks HTTP status + `data.error`, retains last list on failure, non-empty error banner (never "All caught up" on error); triage priority/age enriched into React state so a late fetch re-sorts; relay/delivery warnings raised to a persistent parent notice panel **before** the card is removed. |

---

## M01 — legacy pitch statuses + feedback-erasing resubmission

**approve route (`src/app/api/pipeline/approve/route.ts`)**

- `CANONICAL_PITCH_STATUS = [pending-review, pending-supervisor-review,
  supervisor-approved, zach-approved, rejected, rework, sent]`.
- `LEGACY_STATUS_MAP = { pending → pending-review, conditional → rework }`.
  The incoming `status` is trimmed, remapped through that table, then required to
  be canonical (else `400 Invalid status: … Expected one of …`). A legacy string
  is **never** persisted — `c.pitchDraft.status` is only ever assigned the
  canonical value. Response echoes `remappedFrom` when a remap happened.
- Feedback retention: on `rejected`/`rework` with a reason, `reviewFeedback` is
  written **with `revisionHash = hashRevision(subject, body)`**. On
  `zach-approved`/`supervisor-approved`/`sent` the feedback is cleared (decision
  resolved in the pitch's favour). On a **bare flip back to a review queue**
  (`pending-review` / `pending-supervisor-review`) the feedback is **kept** and
  only dropped once the stored `revisionHash` no longer matches the current
  draft — i.e. resubmitting the *same* body no longer erases the reviewer's
  notes; revising the body does.
- `rework` decision message added; the dead `status === "pending"` branch removed.

**Approvals UI (`src/app/approvals/page.tsx`)** — `resubmit()` now posts
`status: "pending-review"` (was `"pending"`).

**Agent work selector (`src/lib/data.ts` `getWorkInbox`)** — the `agentWorkList`
loop now pushes for `pst === "rejected" || pst === "rework"` (titled "Pitch
rework" vs "Pitch rejected"), so rework-flagged pitches show up as owed work.
`inReview` still counts only `pending-review` / `pending-supervisor-review`
(rework is agent work, not review), matching the existing model.

## M02 — status-only pitch blocked demo

- `hasReviewablePitch(company)` (exported from `data.ts`): true only when
  `pitchDraft.body` is a non-blank string. A `{ status: "pending-review" }` stub
  is not reviewable.
- `client-workstation.tsx`: `showApprovalPanel = hasReviewablePitch || hasDemo`
  and `showBuildDemo = !hasDemo && (isDemoReady || demo.status ===
  "build-requested")` are computed independently and both can render (stacked in
  one column). A stub pitch no longer suppresses the "Build demo" control.
- `client-approval-panel.tsx`: `hasPitch = hasReviewablePitch(company)` — a stub
  renders no pitch block, never enters `scope`, never triggers the email gate.
- `approve-combined/route.ts`: local `isReviewablePitch(pd)` guards both the
  read-only pre-send email gate (`preHadPitch`) and the in-mutation `hadPitch`.
  Added per-scope validation: `scope:"pitch"` with no reviewable pitch → 400;
  `scope:"demo"` with no demo URL → 400. `scope:"both"` stays lenient (acts on
  whatever exists), so an independent demo-only approval is never blocked by a
  status-only pitch.

## M07 — approval failures swallowed (`src/app/approvals/page.tsx`)

`ApproveButtons` rewritten:

- Shared `post()` helper throws `Error(json.error || "Request failed (HTTP …).
  Nothing was changed — try again.")` when `!res.ok || !json.ok`.
- `approve()` / `resubmit()` catch and render the message inline
  (`actionError`, rose text); they no longer no-op on failure.
- `reject()` **throws** on failure so `RejectForm` keeps its form mounted and
  shows the real server message (previously a blocking `alert()` /
  generic string).
- On success: `settle(msg)` shows a server-derived outcome line (queued /
  delivered vs "agent relay lagged (…)"), then `setTimeout(onRefresh, 1500)`
  re-fetches the pipeline (`load`) — the card drops out of the queue because its
  status is now `zach-approved`, instead of being yanked the instant the POST
  resolved. Buttons disable once an outcome is shown to prevent double-submit.
- `ApprovalCard` now takes `onRefresh` (wired to the page's `load`) instead of
  `onDone`. `removedIds` is still used by bulk approve, which already checked
  both HTTP status and `ok`.

## M17 — demo read failures masquerade as empty queue (`src/app/demos/page.tsx`)

- `load()` now `throw`s on `!res.ok` and on `data.error`; on failure it **keeps
  the previous `demos`** and sets `error`
  ("Couldn't refresh the demo queue (…). Showing the last loaded list.").
- New always-visible error banner with a Retry button (renders even when a stale
  list is on screen). The empty-state card now checks `error` first and shows
  "Demo queue unavailable — retry above." — **never "All caught up" on an
  HTTP/network error**. Explicit `loading` / error / empty / list states.
- Triage priority/age moved off the module-level `Map` (which never triggered a
  re-sort) onto `DemoEntry.triagePriority` / `triageReviewedAt`, enriched into
  the `demos` **state array** during `load()`. `demoRank` reads those fields, and
  the sort `useMemo([demos, …])` re-runs when enrichment lands. Removed the dead
  `demoMeta` Map + `setDemoTriageMeta` / `DemoTriageMeta` exports (unused
  elsewhere).
- Delivery warnings: parent `notices` state + `pushNotice`/`dismissNotice`,
  rendered in a persistent amber panel above the grid. `DemoCard.approve()` calls
  `onNotice({...})` with the relay-failure detail **before**
  `onChange("remove-approved")`, so the warning outlives the card. Feedback
  (reject/rework) submissions also push a notice when the relay doesn't confirm.

---

## Legacy paths left

**None.** Legacy `pending` / `conditional` are accepted as *input* to the approve
route but are remapped to canonical values before any persistence; they remain in
the `pitchDraft.status` type union annotated "tolerated on READ only" because
historical Blob rows may still carry them and removing them from the union would
be a false claim that they can't appear. No code writes them.
