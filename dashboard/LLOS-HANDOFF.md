# LLOS — Local Launch OS Dashboard (Handoff)

> Single source of truth for agents working on the Local Launch OS (LLOS) dashboard.
> Last updated: 2026-08-24 by revenue-gen profile.
> If you are a different agent picking this up, read this whole file before touching code.

## What this is

A Next.js (App Router, Next 16 / Turbopack) dashboard for Local Launch (Simpsonville SC —
websites/SEO for blue-collar local biz). It lets Zach review pitches, approve/reject demos,
and manage the prospect pipeline from anywhere.

- **Live URL:** https://dashboard-eight-sage-89.vercel.app — login code `0613` (env: `ACCESS_CODE`)
- **Source:** `/mnt/d/LocalLaunch/dashboard` (git repo, root = `/mnt/d/LocalLaunch`)
- **Data:** `dashboard/data/pipeline.json` (bundled at build time — NOT a live DB)
- **Deploy:** Vercel (prod alias above). `vercel deploy --prod` from the dashboard dir.

## Architecture (read before coding)

- `src/lib/data.ts` — `getCompanies()`, `getStages()`, `getAgency()`, `getStats()`, `getOpenTasks()`.
  **`getCompanies()` imports `data/pipeline.json` statically** (frozen at build). Live data on Vercel
  = whatever was in that file at deploy time.
- `src/lib/pipeline-store.ts` — `readPipelineSafe()` / `writePipeline()` read/write **Vercel Blob**
  (`dashboard-store` blob). This is the runtime store the home-machine agent writes to, but the
  **deployed UI reads the bundled file**, not Blob. Don't assume Blob == what users see.
- `src/lib/stages.ts` — stage themes + priority themes/weights. `priorityTheme(p)` lowercases the
  key; unknown values fall back to weight 0 (lowest). Keep priority values to the 4 canonical tiers.
- `src/components/sidebar-nav.tsx` — left nav + **GlobalSearch** (type-ahead company lookup).
- `src/app/approvals/page.tsx` — pitch approval queue (search + status filter).
- `src/app/demos/page.tsx` — demo approval queue (search + status filter).
- `src/app/clients/page.tsx` — all companies (stage tabs + search).
- `src/app/api/*` — `pipeline/data` (GET companies), `pipeline/approve` (POST), `demos` (GET queue),
  `approve-combined` (unified pitch+demo approve → relays to Supervisor), `client/activity` +
  `client/file` (LOCAL-ONLY vault readers), `fleet/*` (LOCAL-ONLY monitoring).
- `src/lib/vault-reader.ts` — local-only fs logic, dynamically imported only when `!IS_SERVERLESS`.

## Data model (canonical values — DO NOT introduce new spellings)

**Priority (4 tiers only):** `high` | `medium-high` | `medium` | `low`
(lowercase, hyphenated). Variant spellings like `HIGH (broken-site pattern)`, `MEDIUM-HIGH`,
`low-medium` were normalized away on 2026-08-24. If you see them, re-run the normalizer.

**pitchDraft.status:** `pending-review` | `supervisor-approved` | `pending-supervisor-review` |
`zach-approved` | `sent` | `rejected` | `rework`
(Variant `pending supervisor review` was collapsed to `pending-supervisor-review`.)

**stage (pipeline stages):** `prospect` | `audit` | `pitch` | `contacted` | `build-launch` |
(+ `response`, `won`, `lost` per `stages` config). Approval queue = stage `pitch` AND status not in
(`zach-approved`, `sent`).

**demoUrl:** `https://<slug>-demo.vercel.app` — set on companies that have a deployed demo folder in
`/mnt/d/LocalLaunch/demos/<slug>/`. 31 companies have demoUrl as of 2026-08-24.

**Login:** `ACCESS_CODE` env (short code, currently `0613`) checked in `middleware.ts` +
`src/app/api/auth/login/route.ts`. `DASHBOARD_TOKEN` is a fallback.

## Recent changes (2026-08-24)

1. **Demos tab was empty** — root cause: no `demoUrl` in pipeline. Linked 31 companies to their
   deployed demo folders (`/mnt/d/LocalLaunch/demos/`). Demos now show with live links.
2. **Build was broken by 2 local-only vault routes** (`/api/client/file`, `/api/client/activity`)
   — Turbopack traced `fs.readdirSync` on a static path and failed the build. Fixed by isolating fs
   logic in `src/lib/vault-reader.ts` (dynamic `import("fs")` inside functions) and only dynamically
   importing it when `!IS_SERVERLESS`. These routes return 503 "local-only" on Vercel.
3. **Deleted then restored** the vault routes properly (see #2) so Client Assets + Activity tabs show
   a clean "local-only" message instead of a 404 error.
4. **Approvals page**: added search (name/category/location) + status-filter pills.
5. **Clients page**: added search + "Not in the dashboard" empty state.
6. **Global sidebar search** (`GlobalSearch`): type-ahead lookup, jumps to `/company/<id>`, or shows
   "Not in the dashboard yet."
7. **Normalized priority + pitchDraft.status** to canonical values (script:
   `scripts/normalize-pipeline.py`).
8. **Frosted-grey scrim** added to `motion-background.tsx` (mutes bright particles behind content).
9. **Unified approval panel** (`client-approval-panel.tsx`) — pitch + demo together in each client
   profile; approve/disapprove+reason relays to Supervisor (`/api/approve-combined`).

## CRITICAL gotchas (will bite you if ignored)

- **`pipeline.json` is gitignored** (empty in git). Vercel builds from the LOCAL file at deploy time.
  If the local file drifts from what's live, a deploy will freeze the drifted version. To preserve
  live data when deploying: pull `/api/pipeline/data`, merge your changes, write to the local file,
  THEN deploy.
- **Turbopack filesystem tracing**: any route that statically `import ... from "fs"` and uses it on a
  path Turbopack can trace will FAIL the build (`Command "npm run build" exited with 1`). Fix = move
  fs logic to `vault-reader.ts` and dynamically `import()` it only inside `if (!IS_SERVERLESS)`.
  Never put a static `fs` import in an `app/api/*/route.ts` that reaches a literal path.
- **`.next` cache**: if you see stale `validator.ts` type errors after deleting routes, `rm -rf .next`
  and rebuild.
- **Local-only routes** (`client/*`, `fleet/*`) return 503 on Vercel by design. They read
  `/mnt/d/Obsidian/...` and `systemctl` — only exist on Zach's office machine. Don't "fix" the 503;
  make the frontend handle it gracefully (the tabs already do).
- **Don't deploy the 51-company local file over the 264-company live data.** Always reconcile first.
- **Credentials**: never put Neon/DB/Vercel tokens in chat or commit them. `BLOB_READ_WRITE_TOKEN`
  lives in `.env.local` (gitignored). Vercel env set via `vercel env`.

## How to deploy

```bash
cd /mnt/d/LocalLaunch/dashboard
# (optional) reconcile pipeline.json with live data first
rm -rf .next
vercel deploy --prod      # uses local files; aliases to dashboard-eight-sage-89.vercel.app
# verify:
curl -s -m 20 -H "Cookie: ll_dash_auth=0613" \
  https://dashboard-eight-sage-89.vercel.app/api/pipeline/data | python3 -c "import json,sys;print(len(json.load(sys.stdin)['companies']),'companies')"
```

Vercel token: `/home/zach/.vercel/auth.json` (on the office machine). `vercel` CLI must be logged in.

## Useful scripts

- `scripts/normalize-pipeline.py` — normalize priority + pitchDraft.status to canonical values.
  Run: `python3 scripts/normalize-pipeline.py` (operates on `data/pipeline.json`).

## Verification checklist after any change

- [ ] `npm run build` exits 0 (no Turbopack fs-trace error)
- [ ] Live `/api/pipeline/data` returns expected company count (should be ~264, not 51)
- [ ] `/api/demos` returns the demo entries (31 as of 2026-08-24)
- [ ] Approvals/Demos/Clients pages return 200
- [ ] If you touched `pipeline.json`, confirm priority + status values are canonical

## Who builds what (division of labor — HARD RULE)

- **Supervisor profile** builds the actual demo sites (via Claude Code `/hallmark`).
- **revenue-gen** (this agent) does prospecting, verification, dead-business scans, dashboard/infra
  work, and feeds verified leads to the Supervisor. It does NOT build or deploy demos.
- Any agent working on the dashboard should NOT deploy demo sites or pitch emails — those route
  through the Supervisor relay (`SUPERVISOR_RELAY_URL`, default http://137.184.135.50:9930/chat).
