# Critical data-loss fixes — 2026-09-08

Three verified CRITICAL data-loss bugs in the dashboard data layer. Source edits
+ build verification only. Nothing deployed, no worker run, live Blob untouched.

Function signatures/exports unchanged: routes still call `readPipelineSafe()`,
`mutatePipeline()`, `readPipeline()`, `writePipeline()`.

---

## C02 + H03 — `src/lib/pipeline-store.ts`

### The bugs
1. **Silent local fallback on a failed Blob read.** `readPipelineWithEtag()`
   caught any non-404 Blob error (network blip, truncated body, bad JSON),
   swallowed it, and fell through to the local `data/pipeline.json` returning
   `{data: <stale local>, etag: null}`. The next `mutatePipeline()` then did an
   **unconditional** `put()` (no `ifMatch` because `etag` was null), replacing
   the live 264-company book with whatever stale copy this machine had.
2. **Write-order + false success.** `writePipelineWithEtag()` wrote the local
   mirror FIRST, then the Blob. On a non-conflict Blob failure when NOT
   serverless it logged a warning and returned `{ok: true}` — callers (and the
   UI) recorded a commit that never reached the source of truth.
3. **CDN-cached ETag.** The Blob `get()` had no `useCache: false`, so a
   mutation read could get a stale body + stale ETag from the CDN; the
   subsequent conditional write would then race against the true origin state.

### The fixes
- **Read (`readPipelineWithEtag`):**
  - When a token IS set, the live Blob is the *only* source. A non-404 read
    failure (or an unreadable/invalid body) now returns `{data: null, etag:
    null}` — **fail closed**. That trips the existing
    `mutatePipeline()` guard `"Pipeline store empty or unreadable"`, so a
    mutation aborts instead of overwriting live with stale local data.
  - A genuine 404 / `null` from `get()` is treated as a valid empty/missing
    state (`{data: null}`) — **not** an error, but it does **not** auto-restore
    from the local file either. (Seeding a missing store is the watchdog's job,
    via a validated versioned backup + conditional create.)
  - The local file is read **only** when NO token is configured (explicit
    local-dev mode).
  - Added `useCache: false` to the `get()` options.
- **Write (`writePipelineWithEtag`):**
  - When a token IS set: commit to the Blob **first** (with `ifMatch: etag`
    when we have one). Only after that succeeds do we refresh the local mirror,
    writing the exact committed JSON string. Local-mirror failure is a logged
    warning (the durable copy is already on the Blob).
  - A non-conflict Blob failure with a token set now returns `{ok: false,
    error}` — no more phantom `{ok: true}`.
  - Conflict detection (412 / `BlobPreconditionFailedError`) is unchanged, so
    `mutatePipeline()`'s retry loop still works.
  - No token: local-only mode; a write error returns `{ok: false}`. Serverless
    with no token still returns `{ok: false, "No persistent store…"}`.
- `mutatePipeline()`'s read→mutate→conditional-write retry loop is **unchanged**.
- Local dev (no `BLOB_READ_WRITE_TOKEN`) and Vercel serverless both still work.

---

## C03 — `scripts/blob-watchdog.js`

### The bug
`blobCompanies` started at `-1`. Any read error (network/parse) left it `-1`,
and the branch `missing || blobCompanies === 0 || blobCompanies === -1` then
read the **local** file and did an unconditional
`put(..., {allowOverwrite: true})` over the live book. A transient read blip =
the live book silently replaced by this machine's local copy.

### The fix — full rewrite of the read/heal logic
- `readLiveBlob()` returns a discriminated result:
  - `{state: 'ok', text, etag, companies}` — read + parsed successfully.
  - `{state: 'missing'}` — `head`/`get` returned null, or a 404 error.
  - `{state: 'error', error}` — transient (network/parse) failure that
    survived `MAX_READ_ATTEMPTS` (3) bounded retries with a 4s backoff.
- **Transient error → write nothing.** Log + `process.exit(1)`. A read error is
  never treated as permission to overwrite.
- **Read OK → back up the live content.** `backupLive(text, etag)` writes the
  successfully-read live book (not the local file) to
  `data/backups/live/pipeline-<ISO-ts>-<etag>.json`. This versioned, validated
  file is the *only* sanctioned seed source.
  - If the live book has 0 companies: log a WARNING and stop — we do **not**
    auto-overwrite an existing (even if empty) live book.
- **Confirmed missing → seed from a validated versioned live backup only.**
  `findValidLiveBackup()` picks the newest `data/backups/live/*.json` that
  parses AND has `companies.length > 0`. If none exists, log an error and exit
  1 — the local file is explicitly **not** a seed source. The seed uses
  `put(..., {access:'private', token})` with **no `allowOverwrite`** →
  conditional create; the SDK throws if the blob now exists (concurrent
  create), which we catch and treat as "no overwrite performed".
- `backupLocal()` (the old `backup()`) is retained — it only ever copies the
  local file to `data/backups/pipeline-<date>.json`; it never touches the Blob.
- `get()` now passes `useCache: false`.

---

## C01 — `scripts/collect-fleet.js`, `scripts/run-fleet.js`, `scripts/rebuild-worker.js`

### The bug
Each script read the full `pipeline.json`, mutated one owned field, then did
`put("pipeline.json", JSON.stringify(data), {allowOverwrite: true, token})`
with **no `ifMatch`**. Any concurrent mutation (an approve/rework from the UI,
or another of these cron scripts) that landed between the read and the write
was silently overwritten with the full stale book.

### The fix (plumbing only — each script's field logic is unchanged)
- `blobGet()` now returns `{data, etag}` (from `got.blob.etag`) and reads with
  `useCache: false`. It throws if the blob is missing instead of crashing on
  `got.stream`.
- `blobPut(data, etag)` adds `ifMatch: etag` when an etag is present
  (still `allowOverwrite: true`, which `ifMatch` implies).
- Each script got an `isConflict(e)` helper (412 / `BlobPreconditionFailedError`
  / "precondition failed" message) and a bounded re-read + re-apply loop
  (`MAX_ATTEMPTS = 3`). On conflict it re-reads the fresh book, re-applies only
  its owned changes, and retries. It never falls back to an unconditional
  overwrite.
  - **collect-fleet.js:** `commitFleetStatus(fleetStatus)` — owns
    `data.fleetStatus`.
  - **run-fleet.js:** `commitRun(run)` — owns `data.fleetRun`; called at each
    of the existing checkpoints in the step loop.
  - **rebuild-worker.js:** `commitPatches(token, PATCHES, data, etag)` —
    `PATCHES` is a `Map<companyId, {demo, lastUpdated, timelineEntry}>` filled
    by `recordPatch()` from `markFailure()`, the verification-failure branch,
    and the success branch. Attempt 1 writes the already-mutated book with its
    original etag; on conflict it re-reads and re-applies each per-id patch
    (including `timeline.unshift(entry)`) before retrying.

---

## Verification (all run from `/mnt/d/LocalLaunch/dashboard`)

| # | Command | Result |
|---|---------|--------|
| 1 | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | exit 0 |
| 2 | `npm run build` | exit 0 |
| 3 | `node --check scripts/blob-watchdog.js` | OK |
| 4 | `node --check scripts/collect-fleet.js` | OK |
| 5 | `node --check scripts/run-fleet.js` | OK |
| 6 | `node --check scripts/rebuild-worker.js` | OK |

## Legacy unsafe paths deliberately left in place

None. Every write path in the touched code is now either conditional
(`ifMatch`), a conditional create (no `allowOverwrite`), or an explicit
local-only-mode file write.

## Notes for the reviewer

- The working tree already had substantial uncommitted changes in the three
  `scripts/*.js` files (the Orgo-droplet migration for collect-fleet, etc.)
  before this work. The per-file `git diff` therefore mixes that prior work
  with these fixes; the fix-specific changes are the `blobGet`/`blobPut`/
  `isConflict`/`commit*`/`recordPatch` additions and the call-site swaps
  described above. `src/lib/pipeline-store.ts` had no prior uncommitted changes.
- `@vercel/blob` in `node_modules` supports `get(..., {useCache:false})`,
  `get()` returning `null` on 404 with `blob.etag` on success, and
  `put(..., {ifMatch})` throwing `BlobPreconditionFailedError` on mismatch —
  confirmed against `node_modules/@vercel/blob/dist/*.d.ts`.
- Not deployed. No worker executed. Live Vercel Blob not touched.
