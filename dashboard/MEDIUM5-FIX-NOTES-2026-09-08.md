# MEDIUM batch 5 — M08 / M12 / M16 (2026-09-08)

The three most architectural MEDIUM-tier issues. Minimal, correct changes only.
Source edits + build verification only — **NOT deployed**, no worker scripts run,
no live Blob / production data touched.

---

## M08 — playbook checklist was browser-local

**Was:** ticking a step wrote only `localStorage` (`local-launch:playbook:<id>`).
Other devices, agents and reports kept seeing the file's original `done`;
overrides masked authoritative changes; switching company IDs left stale
overrides in place.

**Now:** completion is authoritative pipeline state.

- **NEW `POST /api/pipeline/playbook`** (`src/app/api/pipeline/playbook/route.ts`)
  — auth-gated (`isRequestAuthed`, same as `/api/pipeline/move`), strict body
  validation (`companyId`/`itemId` strings, `done` strict boolean). Flips exactly
  one `company.playbook[].done` atomically through `mutatePipeline` (ETag
  optimistic-concurrency, inherited from prior batches). 404s for unknown
  company / unknown item; 500 on empty/unreadable store.
- **`src/components/playbook-checklist.tsx`** rewritten:
  - `localStorage` shared-state removed entirely (no more `storageKey`, no
    "Reset to pipeline.json" button — the file *is* the state now).
  - Local state is now a pure **optimistic overlay** (`pending: Record<id,bool>`):
    shows the new checkbox value while the POST is in flight, disables that row,
    then `router.refresh()` (the client page is `force-dynamic`) reconciles to
    the server's `done` and the overlay entry is dropped.
  - Failure path: overlay entry reverted, inline error surfaced
    (`saveError` + `TriangleAlert`).
  - Company change (`useEffect([companyId])`) clears `pending` + `saveError`.
  - Also calls `invalidatePipeline()` so the shared client cache (M16) — stats,
    open-tasks, other tabs — re-reads.

**`src/lib/data.ts` — no change.** The cited readers (`getStats.playbookDone`,
`getOpenTasks`, `getPlaybookProgress`) already derive from
`company.playbook[].done`; once the write lands in `pipeline.json` they are
correct automatically. Adding anything there would be redundant.

---

## M12 — no durable fleet-run claim / recovery

**Was:** two `run-fleet.js` invocations could both read `queued` and both write
`running` (the retry loop in `commitRun` re-applied unconditionally, so the
second clobbered the first). A crash left `status: "running"` forever and
blocked all new runs. The final status was **always** `done`, even if every step
threw.

**Now** (`scripts/run-fleet.js` + `src/app/api/fleet/run/route.ts`):

1. **Atomic claim.** New `claimRun()`: re-reads the book, aborts if status is no
   longer `queued`, stamps `runId` (`crypto.randomUUID()`) + `claimedAt` +
   `heartbeatAt`, writes with `ifMatch`. A precondition failure **or** a
   non-`queued` status ⇒ returns `null` and the worker logs
   *"run already claimed by another worker — aborting"*. This write is **never
   retried** (a retry would be a second claim). `commitRun()` now also bails if
   `data.fleetRun.runId` no longer matches ours (reset + re-claim by another
   worker) and refreshes `heartbeatAt` on every write.
2. **Honest terminal status.** A blank / `"(no reply)"` agent reply is recorded
   as `entry.error = "empty agent reply"` (not a completed step). After the loop:
   all steps errored ⇒ `status: "failed"`; some errored ⇒ `"partial"`; none ⇒
   `"done"`. `run.error` carries `"<step>: <msg>; …"`.
3. **Stale-run recovery.** `POST /api/fleet/run` now takes an optional
   `{ reset: true }` body and treats a `queued`/`running` run with no
   `heartbeatAt`/`claimedAt` progress for **> 10 min** as wedged (crashed
   worker): it is cleared and replaced with a fresh `queued` run
   (`recoveredFrom` breadcrumb, `recovered: true` in the response). A live run
   still 409s. `GET /api/fleet/run` now also returns `stale: <bool>`.
   `fleetRun` objects gain `runId` / `claimedAt` / `heartbeatAt` / `error`.

**`src/app/fleet/page.tsx`** (small, to make the new recovery reachable from the
UI — the "Run" button was hard-disabled during `running`): poll now reads
`stale`; when stale the button is re-enabled, relabelled *"Reset wedged run &
re-run"*, and POSTs `{ reset: true }`. Added honest `failed` / `partial` result
lines.

---

## M16 — independent snapshots + misleading health

### 1. One shared client cache (`src/hooks/use-pipeline.ts`)

Replaced the per-instance `useState` + mount-fetch with a **module-level store**
(`snapshot` + `listeners` + a single de-duped `inFlight` fetch), consumed via
`useSyncExternalStore`. Every `usePipeline()` consumer (home board, sidebar
badges, global search, leads/clients/reports) now shares one snapshot.

- **`invalidatePipeline()`** exported — one shared re-fetch, called after
  mutations. Wired into `src/app/page.tsx` `handleMove` (on success) and
  `playbook-checklist` (on success) so nav badges / other views reconcile, not
  just the acting component's optimistic state.
- `setCompanies` still exists (kanban optimistic drag) but now patches the
  shared snapshot, so the move is visible everywhere immediately.
- New `lastSync` (epoch ms). **`src/app/page.tsx`** renders
  *"Live pipeline · synced HH:MM:SS"*, and on error shows *"showing last-known
  data from HH:MM:SS"* — last-sync + stale/error state surfaced.
- SSR: module state stays at its constant initial value (`loading:true`,
  `companies:[]`); `invalidatePipeline` only ever runs client-side, so
  `getServerSnapshot === getSnapshot` is stable and hydration matches.

### 2. Token-free agent health check (`src/app/api/agent/chat/route.ts`)

`GET ?health=1` **no longer POSTs a real prompt** ("reply PONG one word only")
to the supervisor and waits up to 25 s for the model. It now does a token-free
`GET {relay}/health` with an 8 s cap and reports `connected: res.ok` +
`latencyMs`. No agent work / capacity is consumed for a liveness probe (it ran
on every dashboard mount plus a 60 s interval).

*Legacy note:* a relay build that predates a `/health` route will read as
offline here. That is the honest answer (we cannot confirm reachability) and is
a one-line fix on the relay side — chosen over keeping the capacity-burning
prompt probe.

### 3. Automation page — real probe, not hard-coded (`src/app/automation/page.tsx`)

`"All 3 online"` was a literal string; the droplet (137.184.135.50) is
frequently overloaded, so it was routinely wrong.

- **NEW `GET /api/automation/status`** — server-side `fetch` of the three
  embedded service URLs (n8n / LibreCrawl / Patter), 6 s cap each. `online` =
  HTTP status `> 0 && < 500` (proxy + app answered); 5xx / timeout / connection
  failure ⇒ offline.
- Page now probes on mount + every 60 s. Each panel header shows a real
  state dot (`online` / `offline` / `checking…`) with a text label; the Status
  stat card shows `Checking…` → `N/3 online` / `All 3 online` and only claims
  "Live probe" once a probe has completed. Unknown state renders as a neutral
  grey dot, never green.

---

## Verification (run in order — all passed)

| # | command | result |
|---|---|---|
| 1 | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | **exit 0** |
| 2 | `npm run build` | **exit 0** (only pre-existing `vault-reader` fs-tracing warnings) |
| 3 | `node --check scripts/run-fleet.js` | **run-fleet OK** |

New routes present in the build manifest: `ƒ /api/automation/status`,
`ƒ /api/pipeline/playbook`.

## Files touched (mine only)

```
scripts/run-fleet.js                        atomic claim + heartbeat + failed/partial status
src/app/api/agent/chat/route.ts             health probe → token-free GET {relay}/health
src/app/api/fleet/run/route.ts              stale-run detection + { reset:true } recovery + GET stale flag
src/app/api/pipeline/playbook/route.ts      NEW — atomic per-item done write via mutatePipeline
src/app/api/automation/status/route.ts      NEW — server-side reachability probe of 3 droplet services
src/app/automation/page.tsx                 live probe wired to header dots + Status card
src/app/fleet/page.tsx                      surface stale run + reset button + failed/partial lines
src/app/page.tsx                            last-sync line + invalidate-on-move
src/components/playbook-checklist.tsx       localStorage store → server write + optimistic overlay
src/hooks/use-pipeline.ts                   per-instance fetch → shared module store + invalidatePipeline()
```

Not reverted (prior-batch uncommitted work left intact): `src/lib/pipeline-store.ts`,
`scripts/dead-letter-alert.js`, `scripts/verify-demo.js`, `src/app/demos/page.tsx`,
`src/lib/data.ts`.

## Legacy paths deliberately left

- **`GET {relay}/health` assumption** — if the relay lacks the route the agent
  chip shows "offline". Deliberate: an honest unknown beats a prompt probe that
  spends agent capacity. One-line relay fix.
- **`run-fleet.js` first `blobGet()` in `main()`** kept before `claimRun()` (a
  second read) purely so "nothing queued" logs without a claim attempt — one
  extra cheap read, not a correctness issue.
- **Stale threshold 10 min** — a legitimate single step can run up to 5 min
  (300 s A2A timeout); the worker heartbeats before every step, so 10 min of
  silence is a dead process, not a slow one.
