# LLOS Dashboard Audit — 2026-09-11

Scope: `src/` only (Next.js 16 + React 19 + TS). Lint-style nits (`any`, unused vars) out of scope — real bugs, dead code, operational risk. No code modified.

## 1. Critical bugs

### C1. `POST /api/demos` has no body-shape validation — wrong-typed `reason`/`notes` throws uncaught 500
- `src/app/api/demos/route.ts:91-98` (destructure with no `isObject`/`badField` check), crash at `:114-115` (`(reason || notes || "").trim()` — an object/number `reason` is truthy and has no `.trim()`).
- Every sibling write route validates via `@/lib/validate` (M06); this one was missed.
- Fix: add the same `isObject` + `badField(body, { companyId: str, action: oneOf…, reason: optional…, suggestedFix: optional…, url: optional… })` guard before destructuring.

### C2. `POST /api/pipeline/approve` — unvalidated `reason`/`suggestedFix` crash on `.trim()`
- `src/app/api/pipeline/approve/route.ts:52-71` destructures without `isObject`/`badField`; `:94` calls `reason.trim()`, `:285` calls `suggestedFix?.trim()`. A numeric/object `reason` → uncaught TypeError → 500 instead of 400.
- Fix: same M06 guard as `approve-combined` (`src/app/api/approve-combined/route.ts:49-70`).

### C3. TOCTOU: pre-send gates run on a pre-read, mutation doesn't re-verify (approve, approve-combined, demos)
- `src/app/api/pipeline/approve/route.ts:101-230` — email MX, dead-pricing, SC-law, and demo-live HEAD checks run against `preCompany`; the atomic mutation at `:235-310` only re-verifies `expectedPitchHash` **if the client sent it** (optional). A concurrent draft/email edit between pre-read and write passes the gate on stale content.
- `src/app/api/approve-combined/route.ts:153-196` — same pattern for the MX gate.
- `src/app/api/demos/route.ts` — the rebuild-job guard (`running`/`verifying` → 409) is checked on the pre-read only; the mutation at `~:200-240` never re-checks `rebuildJob`, so a rebuild claimed after the pre-read is still overwritten by an approval.
- Fix: re-run the cheap gates (email candidate, pricing regex, SC regex, `rebuildJob.status`) inside the mutator against the fresh `c`, or require `expectedPitchHash` on approve paths.

### C4. `GET /api/demos` returns 500 for a valid empty book (M09 violation)
- `src/app/api/demos/route.ts:26-31` — `companies.length === 0` → 500 "empty or unreadable". `GET /api/pipeline/data` (`src/app/api/pipeline/data/route.ts:18-20,56`) correctly returns 200 + `empty:true`. After archiving the last lead, the Demos page errors instead of showing zero state.
- Fix: return `{ demos: [] }` 200 when the store is readable-but-empty (distinguish via `readPipelineState`).

### C5. `POST /api/pipeline/approve` can never write `"sent"` — dead branch + vocabulary drift
- `CANONICAL_PITCH_STATUS` at `src/app/api/pipeline/approve/route.ts:15-24` omits `"sent"`, so `:84-91` rejects it with 400. But `:290-294` handles `status === "sent"` (clearing `reviewFeedback`), and `approve-combined` treats `"sent"` as pitch-approved (`src/app/api/approve-combined/route.ts:272-275`). Nothing via this route can reach that branch; the actual send transition must happen out-of-band (`send_pitch.py`), unaudited by the gate.
- Fix: either accept `"sent"` here (gated) or delete the dead branch and document `send_pitch.py` as the sole writer.

### C6. Stale stage vocabulary in `CompanyCard.sendState`
- `src/components/company-card.tsx:28` treats `responseStatus === "contacted"` as "Sent". `contacted` is a retired **stage** id (migration at `src/lib/pipeline-store.ts:88`), never a valid `responseStatus`. Harmless today (matches nothing real) but masks a real "contacted" mis-write as a successful send.
- Fix: drop `|| rs === "contacted"`.

### C7. `needsPricingRewrite` disagrees with the enforce gate on dead pricing
- `src/lib/data.ts:603-610` flags only `$300`/`$49` + banned close. The blocking gate `gateDeadPricing` (`src/lib/email-gate.ts:246-253`) also blocks `$90` and `Launch/Grow/Dominate` tiers. Drafts with `$90`/tier pricing show "no rewrite needed" in the UI but hard-fail at approve time.
- Fix: share one regex list between the two.

## 2. Dead code to delete

Verified zero imports outside the defining file (middleware still gates `/api/*`, so these are not auth fallbacks — just unused):

| File | Export | Evidence |
|---|---|---|
| `src/components/motion-background.tsx:20` | `MotionBackground` | no importer |
| `src/components/todays-tasks.tsx:14` | `TodaysTasks` | no importer (sidebar uses `WorkInbox`? — see below) |
| `src/components/work-inbox.tsx:54` | `WorkInboxPanel` | no importer → work-inbox pipeline is dead end-to-end |
| `src/components/metric-card.tsx:34` | `MetricCard` | no importer |
| `src/components/stats-bar.tsx:10` | `StatsBar` | no importer |
| `src/components/pipeline-kanban.tsx:37` | `PipelineKanban` | no importer (`/pipeline` renders `StageColumn` directly) |
| `src/components/car-lots-section.tsx:9` | `CarLotsSection` | no importer |
| `src/components/client-header.tsx:10` | `ClientHeader` | no importer (client page inlines its hero) |
| `src/components/client-contact.tsx:14` | `ClientContact` | no importer |
| `src/lib/data.ts:270` | `getCompanySlugs` | no caller |
| `src/lib/data.ts:274` | `getCarLotsPipeline` | no caller |
| `src/lib/data.ts:363` | `LEAD_STAGES` | no importer |
| `src/lib/data.ts:381` | `isOpenPitchStatus` | no caller |
| `src/lib/data.ts:387,393` | `getApprovalQueue`, `pendingApprovalCount` | no callers (approvals page uses its own derivation) |
| `src/lib/data.ts:477,483` | `isScFocus`, `isExpansion` | no callers |
| `src/lib/data.ts:559` | `activeEmailGate` | defined, never called (M04 plumbing with no reader) |
| `src/lib/data.ts:615` | `getWorkInbox` | no caller (pairs with dead `WorkInboxPanel`) |
| `src/lib/data.ts:942,982` | `getOpenTasks`, `groupPlaybookByStage` | no callers (pairs with dead `TodaysTasks`) |
| `src/lib/fleet.ts:27,34` | `agentByPort`, `readPeerToken` | no callers |
| `src/lib/crm-client.ts:94,101,146,161` | `crmQuery`, `crmMutation`, `crmListCompanies`, `crmUpsertCompany` (untyped wrappers) | all live callers use the `*Result` variants |
| `src/lib/session.ts:23` | `base64url` | only used inside `session.ts` — unexport it |

Keep (false positives checked): `CompanyTile` (used by `stage/[id]`), `StageTracker`/`ClientTimeline`/`ClientSummary`/`QuickDispatch`/`SeoGauge`/`ProgressRing` (used by `client-workstation`), `writePipeline` (used by `approve-combined`, `demos`), `readPipeline` (used by chat/activity/audit routes), `migrateLegacyStages` (used on every read path — though see O4).

## 3. Operational risks

### O1. Single-layer auth on every state-changing route except 5 (defense-in-depth gap)
Only `pipeline/leads*`, `pipeline/move`, `pipeline/playbook` call `isRequestAuthed` in-handler. All of these rely solely on `src/middleware.ts` (which does gate `/api/*` → 401/redirect, fail-closed at `:60-82`): `api/agent/chat`, `api/approve-combined`, `api/pipeline/approve`, `api/pipeline/build-demo`, `api/demos`, `api/demos/audit`, `api/email/verify`, `api/client/*`, `api/automation/status`, `api/fleet/*`. Middleware is correct, but any matcher/exclusion mistake (e.g. the `/_next`-style carve-outs at `:24-33`) silently opens a write route. The codebase's own "double-gate" convention (`src/lib/session.ts:82-87`) is honored by only 5 of ~20 routes.
- Fix: add the one-line `isRequestAuthed` check to the write routes (note: `approve`/`approve-combined`/`build-demo` take `Request`, not `NextRequest` — adapt the helper's type or switch signatures so cookies are readable in-handler).

### O2. Login rate limiter is per-instance — no-op on Vercel serverless
- `src/app/api/auth/login/route.ts:12-33` — `attempts` Map lives in instance memory; each serverless invocation gets a fresh map, so the "10 attempts / 10 min" brake never triggers across instances. Short numeric `ACCESS_CODE` (`:8`) + no durable throttle = brute-forceable.
- Fix: throttle on something durable (Vercel KV/Upstash) or require the long token only.

### O3. `GET /api/pipeline/data` fans out to CRM synchronously on every dashboard load
- `src/app/api/pipeline/data/route.ts:42-50` — every poll calls `crmListCompaniesResult(500)`, which pages up to 40 CRM round-trips (`src/lib/crm-client.ts:126-141`) with 8s timeouts each. A slow CRM makes the single read path that "every consumer" shares (`src/hooks/use-pipeline.ts:22-31`) slow; a CRM outage is handled (M10) but latency is not bounded in aggregate.
- Fix: cache CRM mirror briefly, fetch it client-side separately, or cap pages for the dashboard call.

### O4. `migrateLegacyStages` re-runs on every read, persists only as a side effect of writes
- `src/lib/pipeline-store.ts:180,190` — reads mutate the in-memory book (including setting `legacyBuildStageMigrationVersion`) but never write back; persistence depends on the next unrelated `mutatePipeline` committing the migrated copy. A read-only deployment never converges the stored book.
- Benign (idempotent) but means Blob contents and served contents permanently disagree on idle instances. Consider persisting once when `changed === true` outside a mutator, or documenting read-only intent.

### O5. No secrets hardcoded in `src/` — verified clean
Grep for `sk-`, `api_key = "…"`, `password/secret = "…"` hit only variable names (`resendScope`, relay header wiring). All credentials flow via `process.env` (`DASHBOARD_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `CRM_*`, `SUPERVISOR_RELAY_URL`, `VAULT_ROOT`) with fail-closed behavior (`relay-config.ts:18-33`, `session.ts:49-52`, `middleware.ts:60-69`). No action.

### O6. Minor: demo-live HEAD check fetches draft-embedded URLs server-side
- `src/app/api/pipeline/approve/route.ts:196-205` — SSRF surface is narrow (only `*.vercel.app` URLs extracted from Zach-authored drafts, 15s timeout), but there is no host allowlist enforcement beyond the regex. Low priority; consider pinning to `https://*.vercel.app`.

## 4. Improvements

1. **Perf — `use-pipeline.ts` error path leaves `isEmpty` stale.** `src/hooks/use-pipeline.ts:95-99` sets `error` but keeps the previous `companies`/`isEmpty`; a failed revalidation after deleting the last lead shows stale rows with no error affordance. Set `isEmpty` explicitly on error/success.
2. **Perf — unbounded `.map` over the whole book in hot GETs.** `GET /api/demos` (`demos/route.ts:33-73`) and `crmUpsertCompanyResult` (full 500-row list + linear name match, `crm-client.ts:198-202`) scale O(N) per request with no pagination. Fine at ~280 rows; add `limit`/`page` before the book grows.
3. **A11y — kanban drag handles are keyboard-inert.** `stage-column.tsx:111` has `aria-label` on the move button (good), but there is no keyboard drag alternative and `pipeline-kanban.tsx:241` icons are `aria-hidden` without status text for the move result. Add keyboard move (e.g. <kbd>←</kbd>/<kbd>→</kbd> on focused card) and a live-region announcement.
4. **A11y — dialogs**: `add-lead-dialog.tsx:117` has `DialogTitle` (good); audit remaining Radix dialogs for missing `DialogDescription` (screen-reader context).
5. **Loading states are uneven.** `pipeline`/`clients`/`demos`/`approvals`/`fleet` handle loading+error; `page.tsx` (home), `leads`, `automation` have ≤3 loading/error references — verify skeletons exist on slow-CRM loads (see O3).
6. **CRM upsert name-match is collision-prone.** `crm-client.ts:200-202` matches by lowercase name only; two "Upstate …" companies (the exact collision class `vault-reader.ts:6-11` warns about) upsert to the same CRM row. Match on domain/phone first.
7. **`STAGE_DESCRIPTIONS` says "7-stage funnel" for 9 stages** (`src/lib/stages.ts:154`). Comment-only; fix the count.
