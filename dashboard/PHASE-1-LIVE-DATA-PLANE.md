# Phase 1 — Live Data Plane

**Audience:** Minimax M3 (or any builder). Read this entire file before touching code.
**Owner:** Zach / Local Launch OS
**Author:** revenue-gen (2026-08-24)
**Repo path:** `/mnt/d/LocalLaunch/dashboard`
**Live site:** https://dashboard-eight-sage-89.vercel.app
**Auth cookie:** `ll_dash_auth=0613` (env `ACCESS_CODE`; do not print tokens in chat)

Related:
- Architecture + gotchas: `LLOS-HANDOFF.md` (same folder)
- Fleet pointer: `/mnt/d/Obsidian/Local-Launch/LLOS-Dashboard-Handoff-2026-08-24.md`
- Skill: `llos-dashboard-ops`

---

## Why Phase 1 exists (read this or you will build the wrong thing)

The UI already looks like an OS. It is **not** an OS.

Every list you see (Home, Leads, Clients, search, Approvals, Demos) is a **photograph of `data/pipeline.json` taken at `vercel deploy` time**. `src/lib/data.ts` does:

```ts
import pipelineData from "../../data/pipeline.json";
export function getCompanies() { return data.companies; }
```

That import is **frozen in the serverless bundle**. After deploy:

- Approving a pitch can write **Vercel Blob** (`src/lib/pipeline-store.ts` → `writePipeline`).
- Adding a lead still means “copy JSON and redeploy.”
- Dragging a kanban card only updates **this browser**.
- Opening the site tomorrow still shows **yesterday’s snapshot**.

So the product has **two books**:

| Book | What it is | Who reads it today |
|---|---|---|
| **Bundled JSON** | `data/pipeline.json` baked into the Next build | Almost every page + `/api/pipeline/data` + `/api/demos` + `/api/approve-combined` |
| **Vercel Blob** `pipeline.json` | Runtime store `readPipelineSafe` / `writePipeline` | `/api/pipeline/approve` writes here. Blob has **drifted** (was 51 companies with **0** `demoUrl` while live UI showed **264 / 31 demos**) |

Until those are **one book**, nothing else matters. More pages, prettier cards, add-lead dialogs, kanban persist — all of it writes to a store the user does not see, or requires another deploy. That is a brochure with buttons.

**Phase 1 is the OS.** Phases 2–3 are features on top of a live book.

If you skip the seed and “just switch reads to Blob,” you will **wipe the live dashboard down to 51 companies and delete all 31 demo links.** That already almost happened. Do not do it.

---

## Success definition (Phase 1 is done ONLY when all of these are true)

1. Live `/api/pipeline/data` returns **264 companies** (not 51, not 0, not 387).
2. Those 264 include **31 `demoUrl`** values.
3. Approvals queue still computes to **~133** (stage `pitch`, `pitchDraft.status` not `zach-approved`/`sent`).
4. `/api/demos` still returns **31**.
5. After you change **one** company’s `priority` via a write to Blob (test company only), a **refresh of Home / Leads / search** shows the new value **without a new Vercel deploy**.
6. `npm run build` exits 0.
7. You did **not** send pitches, deploy demo sites, or ask the Supervisor for credentials.

If (5) requires `vercel deploy --prod`, Phase 1 failed.

---

## Out of scope (do not build these in Phase 1)

- Add-lead POST (JSON copy dialog stays). That is Phase 2.
- Kanban persist. Phase 2.
- Neon/Postgres migration. Blob is enough.
- Making Fleet / vault Assets work on Vercel. Local-only by design.
- Visual redesign, new nav items, new pages.
- Sending emails or building demos.
- “Helpful” cleanup of the 146 companies in `pitch`. Process, not this ticket.

---

## Hard rules (Minimax: treat as law)

1. **Seed Blob from the LIVE API only.**  
   Source of truth for the seed:  
   `GET https://dashboard-eight-sage-89.vercel.app/api/pipeline/data`  
   with header `Cookie: ll_dash_auth=0613`.  
   Count must be **264** before you write anything.  
   **Never** seed from a local `data/pipeline.json` that has 51 companies.  
   **Never** seed from `git show HEAD:dashboard/data/pipeline.json` (file is gitignored / empty).

2. **Preserve JSON shape** when writing Blob. `src/lib/data.ts` reads:

   ```json
   {
     "agency": { },
     "pipeline": { "stages": [ ] },
     "companies": [ ],
     "carLotsPipeline": { "cars": [] },
     "revenue": {}
   }
   ```

   The live **API response** is flatter (`stages` at top level, not `pipeline.stages`). If you dump the API JSON straight into Blob and then also use it as a bundled file, `getStages()` throws and the build dies. When writing Blob for `readPipelineSafe`, keep `companies` as the 264-array. When writing `data/pipeline.json` for a build, wrap `stages` as `pipeline.stages`. See seed script below.

3. **Do not static-import `fs` in `app/api/*/route.ts`.** Turbopack fails the production build. Vault code stays in `src/lib/vault-reader.ts` with dynamic `import("fs")`.

4. **Credentials stay out of chat, commits, and this markdown’s “example output.”**  
   `BLOB_READ_WRITE_TOKEN` is in `dashboard/.env.local` and Vercel env. Do not print it.

5. **Do not deploy a 51-company file.** After any local write, `python3 -c "import json;print(len(json.load(open('data/pipeline.json'))['companies']))"` must print **264** before `vercel deploy`.

6. **Demo / pitch lane:** you may change dashboard code under `dashboard/`. You may not build or deploy `*-demo.vercel.app` sites or send outreach.

---

## Current wiring (so you know what to flip)

| Path | Reads | Writes |
|---|---|---|
| `src/lib/data.ts` `getCompanies()` | bundled `data/pipeline.json` | nothing |
| `GET /api/pipeline/data` | `getCompanies()` ← **frozen** | — |
| `GET /api/demos` | `getCompanies()` ← **frozen** | — |
| `POST /api/approve-combined` | `getCompanies()` ← **frozen, in-memory only** | does **not** call `writePipeline` |
| `POST /api/pipeline/approve` | `readPipelineSafe()` ← Blob | `writePipeline` (correct store, **wrong book** if Blob is 51) |
| `POST /api/demos` | `getCompanies()` | mutates in-memory bundle object only |
| Home `src/app/page.tsx` | `getCompanies()` at render | kanban local state |
| Leads / Clients / Reports / `GlobalSearch` | `getCompanies()` | — |
| Approvals page | **fetches** `/api/pipeline/data` | POST `/api/pipeline/approve` |
| Demos page | **fetches** `/api/demos` | POST `/api/demos` |

Phase 1 flips **reads** of company lists to Blob, **after** Blob contains the 264-company book. Then one write path (`writePipeline`) is what the UI sees.

`generateStaticParams` for `/client/[slug]` may keep using `getCompanySlugs()` from the bundled file so the build still emits paths. Runtime profile pages should prefer live data when you fetch by id (optional in Phase 1; required that **lists** are live).

---

## Implementation steps (do in this order)

### Step 0 — Inventory (no writes)

```bash
cd /mnt/d/LocalLaunch/dashboard
curl -s -m 25 -H "Cookie: ll_dash_auth=0613" \
  https://dashboard-eight-sage-89.vercel.app/api/pipeline/data -o /tmp/llos-live.json
python3 - <<'PY'
import json
d=json.load(open("/tmp/llos-live.json"))
c=d["companies"]
print("live companies", len(c))
print("demoUrl", sum(1 for x in c if x.get("demoUrl")))
print("keys", sorted(d.keys()))
assert len(c)==264, "REFUSE TO CONTINUE — live is not 264"
PY
python3 -c "import json;print('local file', len(json.load(open('data/pipeline.json'))['companies']))"
```

If live ≠ 264: **stop and report**. Do not invent a merge.

### Step 1 — Seed Blob from live 264

Write `scripts/seed-blob-from-live.mts` (or `.py` if you already have `BLOB_READ_WRITE_TOKEN` in env). It must:

1. Read `/tmp/llos-live.json` (or fetch live again).
2. Abort if `len(companies) != 264`.
3. Build the store object:

```ts
{
  agency: live.agency,
  pipeline: { stages: live.stages ?? live.pipeline?.stages ?? [] },
  companies: live.companies,           // the 264, including demoUrl
  carLotsPipeline: live.carLotsPipeline ?? { cars: [] },
  revenue: live.revenue ?? {},
}
```

4. Call existing `writePipeline(store)` from `src/lib/pipeline-store.ts`.
5. Immediately `readPipelineSafe()` and print `companies.length` + `demoUrl` count. Abort if not 264 / 31.

Do **not** overwrite `data/pipeline.json` in this step unless local file is already 264. If local is 51, leave it; Blob is what you are fixing.

### Step 2 — APIs read Blob

Change these to `readPipelineSafe()` (not `getCompanies()`):

- `src/app/api/pipeline/data/route.ts` — GET companies/stages/agency from Blob. Keep CRM mirror best-effort.
- `src/app/api/demos/route.ts` — GET queue from Blob companies (`demoUrl` or `demo.url`, status ≠ `approved` / `none`).
- `src/app/api/approve-combined/route.ts` — read Blob, mutate, **`writePipeline`**, then relay.
- `src/app/api/demos/route.ts` POST — same: Blob read → mutate → `writePipeline` → relay.

`POST /api/pipeline/approve` already uses the store. After Step 1 it writes the **264** book. Leave its behavior; add missing status strings to its allow-list if needed (`pending-review`, `pending-supervisor-review`, `rework`).

If Blob read returns 0 companies, **fail the request** (500) rather than silently serving the bundled 264. Silent fallback re-creates two books.

### Step 3 — Pages that list companies read the API

Home, Leads, Clients, Reports, and `GlobalSearch` must not call `getCompanies()` as the live list.

Recommended pattern (already used by Approvals):

```ts
const res = await fetch("/api/pipeline/data");
const data = await res.json();
// data.companies
```

- Home is already `"use client"` — load in `useEffect`, keep kanban local (persist is Phase 2).
- Clients / `GlobalSearch` / `AppChrome` header search — fetch once; empty search still means “not in dashboard.”
- Leads / Reports — convert to client fetch **or** async server component that `await readPipelineSafe()`. Do not add a static `fs` import in a route.

Work inbox helpers (`getWorkInbox`, `getApprovalQueue`, `pendingApprovalCount`) stay pure functions of a `Company[]`. Pass the fetched array in. Nav badges should use the fetched list or a tiny `/api/pipeline/counts` if you need badges without shipping 264 companies twice — optional, not required.

### Step 4 — Prove it without a deploy cycle (local)

1. `npm run build` → exit 0.
2. On local `npm run dev` (office machine, `.env.local` has `BLOB_READ_WRITE_TOKEN`):
   - Home shows 264.
   - Change one test field through `writePipeline` (or Approvals reject-then-clear on a **non-client** test id if you must use UI).
   - Refresh Home — change visible.
3. Only then `vercel deploy --prod` from `/mnt/d/LocalLaunch/dashboard`.
4. Re-run the live curls in “Success definition.”

### Step 5 — Document what you did

Append a short “Phase 1 shipped” note to `LLOS-HANDOFF.md` (date, 264/31/133 still true, Blob is now the read path). Do not rewrite this spec.

---

## Acceptance curls (run after deploy)

```bash
URL=https://dashboard-eight-sage-89.vercel.app
C='Cookie: ll_dash_auth=0613'

curl -s -m 20 -H "$C" "$URL/api/pipeline/data" -o /tmp/p.json
curl -s -m 15 -H "$C" "$URL/api/demos" -o /tmp/d.json
python3 - <<'PY'
import json
from collections import Counter
d=json.load(open("/tmp/p.json"))
c=d["companies"]
print("companies", len(c))
print("demoUrl", sum(1 for x in c if x.get("demoUrl")))
print("stages", dict(Counter(x.get("stage") for x in c)))
q=[x for x in c if x.get("stage")=="pitch" and (x.get("pitchDraft") or {}).get("status") not in (None,"zach-approved","sent")]
print("approvals", len(q))
print("demos api", len(json.load(open("/tmp/d.json")).get("demos",[])))
assert len(c)==264
assert sum(1 for x in c if x.get("demoUrl"))==31
PY

# pages
for p in / /approvals /demos /leads /clients /reports; do
  curl -s -m 15 -o /dev/null -w "$p %{http_code}\n" -H "$C" "$URL$p"
done
```

Live-without-redeploy test: pick a harmless field on a lead (not a paying client), write via API, hard-refresh `/leads`, confirm the field changed.

---

## Rollback

Blob `put` overwrites `pipeline.json`. Before seed, if `readPipelineSafe()` returns anything, save it to `/tmp/blob-backup-YYYYMMDD.json` (local only, not git).

If live company count drops after deploy: restore Blob from `/tmp/llos-live.json` (the 264 snapshot you took in Step 0) via `writePipeline`, redeploy only if you also shipped a bad read fallback.

---

## Phase 2 / 3 (do not start until Phase 1 acceptance is green)

**Phase 2 — writes:** Add-lead POST (duplicate id/name check), kanban `POST` stage, stop the JSON-copy dialog.

**Phase 3 — process:** 146-in-pitch pile is Supervisor/Closer work. Fleet/vault stay on the office machine.

---

## If you are stuck

- Live count ≠ 264 → stop. Ask Zach / revenue-gen. Do not merge files by guess.
- Build fails on `fs.readdirSync` → you put filesystem access in a route. Undo. See `LLOS-HANDOFF.md`.
- Blob token missing → read `.env.local` / Vercel env. Do not ask Supervisor over A2A for secrets.
- Approvals empty after flip → you seeded Blob without `pitchDraft` or with 51 companies. Restore from `/tmp/llos-live.json`.
