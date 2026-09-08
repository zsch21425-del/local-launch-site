# HIGH-severity fixes — approval flow (2026-09-08, batch 2)

Scope: exactly two files. No deploy, no worker scripts, no live Blob writes, no
prod data mutation, no credential changes. Route signatures + the relay-to-
Supervisor side effect preserved (only *when* it fires and the reported status
changed).

Verification (run in order, both green):
1. `node node_modules/typescript/bin/tsc --noEmit --incremental false` → exit 0
2. `npm run build` → exit 0

---

## H05 — `src/app/api/demos/route.ts`

Demo approval used to (a) advance the company stage on every click
(pitch→contacted→response→build-launch, bypassing Sale), (b) accept an approval
with no real URL and invent `https://<id>-demo.vercel.app`, and (c) re-run the
full mutation + Supervisor relay on repeated clicks of the same revision.

Changes:

- **New helper `isHttpUrl()`** — accepts only a well-formed absolute `http(s)`
  URL.
- **New pre-read block** (read-only `readPipelineSafe`, before `mutatePipeline`):
  resolves `verifiedUrl` = explicit `url` from the request body **or** the URL
  already stored on `demo.url` / legacy `demoUrl`. No fabricated fallback.
  - `action === "approve"` with no `isHttpUrl(verifiedUrl)` → **HTTP 400**
    (`"Cannot approve: no verified demo URL on this company…"`).
  - `action === "approve"` where `demo.status === "approved"` **and**
    `demo.url === verifiedUrl` → **benign 200** `{ ok:true, idempotent:true,
    relayed:false }`, returned *before* the mutation and *before* the relay →
    no state change, no double relay.
- **Approve branch of the mutation** now does ONLY the versioned demo decision:
  pins `c.demo.url = verifiedUrl`, sets `c.demo.status = "approved"`,
  `reviewedAt`, clears `reviewFeedback`. The `order[]` stage-advance block was
  **removed** — stage advancement now belongs solely to explicit
  send/response/sale events.
- reject / rework branch unchanged (still requires a reason, still resets
  rebuild failure state).
- Relay still fires for a genuine approve (new decision or a changed URL) and
  for every reject/rework. It does **not** fire on the idempotent no-op because
  that path returns early.
- Removed the now-duplicate `const { readPipelineSafe } = await import(...)`
  further down (it is imported once in the pre-read block and reused).
- Relay work-order text: `Demo URL: ${demoUrl || "(none on record)"}` so a
  reject with no stored URL reads cleanly instead of `Demo URL: `.

Body contract: `{ companyId, action, notes?, reason?, suggestedFix?, url? }`.
`url` is new and optional; existing callers (`/demos` page) that omit it keep
working as long as a real URL is already on the record.

## H10 — `src/components/client-approval-panel.tsx`

The panel collapsed demo + pitch into one `storedResult` — if *either* the demo
was approved *or* the pitch was `zach-approved`/`sent`, the whole panel showed
"Approved — agent can proceed" and hid the remaining controls.

Changes:

- **New `ArtifactState` type** (`approved | sent | rejected | rework | pending |
  none`) plus `normalizeDemoState()` / `normalizePitchState()` top-level
  helpers that map the canonical status vocabularies. `sent` is its own
  terminal state, distinct from `approved`. `supervisor-approved` and every
  `pending*` pitch status normalize to `pending` (still needs Zach).
- **Separate state**: `demoState` / `pitchState`, each = an optimistic
  `demoOverride` / `pitchOverride` (set only after a successful POST) ?? the
  normalized store value. No single collapsed boolean.
- **`scope`** = which *included* artifact(s) are still `pending`
  (`"demo" | "pitch" | "both" | null`).
- **`overall`** = `"approved"` ONLY when every included artifact is individually
  `approved` (`demoOk && pitchOk`, where a `sent` pitch counts as past
  approval); otherwise `rejected` / `rework` / `null`.
- **Rendering**:
  - Header badge = `overall` only once nothing is pending (`badgeState = scope
    ? null : overall`); while anything is pending it shows "Awaiting review".
  - Per-artifact status chip next to the "Pitch" / "Demo" labels.
  - Action buttons render whenever `scope` is set (or a deny/rework form is
    open). When only one artifact is pending, a one-line note says the other is
    already decided and the Approve button reads "Approve demo" / "Approve
    pitch". So: approved demo + pending pitch now still shows the pitch
    approve/rework/disapprove controls.
  - `resendScope` lets an already-bounced (rejected/rework) artifact have its
    notes edited + re-sent via "Edit notes / re-send" even though it is no
    longer `pending`.
- **Backend call**: `POST /api/approve-combined` body now includes
  `scope: actScope` (`scope ?? resendScope`) — the explicit demo-vs-pitch
  action scope. `reason` / `suggestedFix` unchanged. Endpoint + method
  unchanged.

---

## Legacy paths left

None in the two edited files.

Note (not a legacy path, out of scope): `src/app/api/approve-combined/route.ts`
still keys its mutation off `hadPitch` / `hadDemo` and does not yet read the new
`scope` field. Effect today: approving a pitch when the demo is already approved
re-writes `demo.status = "approved"` + `reviewedAt` (same terminal value) and
sends one combined relay. Wiring that route to honor `scope` is a follow-up for
whoever owns that file (prior batch touched it); it was explicitly outside this
task's scope.
