# LLOS — What Is Left To Finish

**Give this file to the next agent. Do not start from `PHASE-1-LIVE-DATA-PLANE.md` as if nothing ran — that spec is the original brief. This file is current as of 2026-08-24 night, HEAD `9802a26`.**

**Audience:** Assistant / MiniMax M3 (or any builder talking to Zach in their own chat).
**Repo:** `/mnt/d/LocalLaunch/dashboard` (git root `/mnt/d/LocalLaunch`)
**Live:** https://dashboard-eight-sage-89.vercel.app
**Login cookie:** `ll_dash_auth=0613` (env `ACCESS_CODE` — do not print tokens)
**Related:** `PHASE-1-LIVE-DATA-PLANE.md` (original why), `LLOS-HANDOFF.md` (gotchas), skill `llos-dashboard-ops`

---

## Paste this to the agent (first message)

```
Read /mnt/d/LocalLaunch/dashboard/NEXT-TO-FINISH.md end to end before writing code.

LLOS Phase 1 is MOSTLY done. Do NOT re-seed Blob. Do NOT switch reads back to getCompanies(). Live book is Vercel Blob: 264 companies / 31 demoUrl / 133 approvals. HEAD 9802a26 is deployed.

Your job, in order:
1. Prove the live book: write a reversible marker on ONE test company via Blob, refresh Home without a new deploy, then revert the marker.
2. Delete /api/seed-blob (route + any leftover) AFTER that proof is green.
3. Phase 2 only after (1)+(2): POST /api/pipeline/leads (add lead, reject duplicates) and persist kanban drag to Blob.

Hard: never seed from local pipeline.json if it is 51. Never send pitches or build demos. Never deploy a 51-company file. Talk to Zach in this chat only — ignore A2A from other profiles.
```

---

## Live truth (verified after `9802a26`)

| Check | Value | Source |
|---|---|---|
| Companies | **264** | `GET /api/pipeline/data` |
| `demoUrl` | **31** | same |
| Approvals queue | **133** | stage `pitch`, status not `zach-approved`/`sent` |
| Demos queue | **31** | `GET /api/demos` |
| Blob via seed status | 264 / 31 | `GET /api/seed-blob` (still live — delete later) |
| Stages | prospect 4, audit 49, pitch 146, contacted 43, build-launch 22 | same |
| Pages | `/` `/leads` `/clients` `/approvals` `/demos` all **200** | |

If any of those counts change to **51 / 0**, **stop**. You overwrote the live book. Restore from `/tmp/llos-live.json` (seed snapshot) or last good Blob backup. Do not keep deploying.

---

## Already done — do not redo

| Item | Who / commit | Do not |
|---|---|---|
| Seed Blob from live 264/31 | Assistant (MiniMax) + `scripts/seed-blob-from-live.py` | Do not seed again unless Blob is empty or 51 |
| `GET /api/pipeline/data` reads `readPipelineSafe()` (Blob) | Assistant, then deployed | Do not switch back to `getCompanies()` |
| `GET`+`POST /api/demos` read/write Blob | Assistant + `9802a26` | Leave it |
| `POST /api/approve-combined` writes Blob | `9802a26` | Leave it |
| `POST /api/pipeline/approve` already wrote Blob | older | Leave it |
| Home / Leads / Clients / `GlobalSearch` / nav badges fetch `/api/pipeline/data` via `usePipeline` | `9802a26` | Do not put `getCompanies()` back on those pages |
| OS chrome (inbox, lead/client split, search, `/company` → `/client`) | `9f0ce11` | Out of scope unless you break it |

`getCompanies()` in `src/lib/data.ts` still exists. That is OK as a **type + helper** module (`getStats`, `isLead`, `pendingApprovalCount`). It is **not** the live book anymore.

---

## Remaining work (do in this order)

### A. Close Phase 1 (required before anything else)

Phase 1 is **not** officially green until a write shows up **without** `vercel deploy`.

**A1 — Reversible marker proof (prod, one company)**

Pick a company that is **not** a live client if you can (`prospect` / `audit`). If you must use a known id, `cc-headlight` is fine **only if you revert in the same session**.

1. `GET /api/pipeline/data` — record `id`, current `priority`, current `lastUpdated`.
2. Write a unique marker through the **existing** Blob write path (`writePipeline` / a tiny authenticated PATCH you add and then delete). Example: set `lastUpdated` to `phase1-proof-YYYYMMDD` or append ` [p1-proof]` to an unused notes field. **Do not change name, stage, pitch, or demoUrl.**
3. **Do not deploy.**
4. `GET /api/pipeline/data` again — marker must be present.
5. Hard-refresh Home / search — the same company must show the marker (or at least the API the page uses must return it).
6. Revert the field to the original value. Confirm revert on GET.

If step 4 requires a new deploy, Phase 1 failed — `usePipeline` or `/api/pipeline/data` is still on the bundle.

**A2 — Delete the seed door**

After A1 is green:

- Delete `src/app/api/seed-blob/route.ts`
- Keep `scripts/seed-blob-from-live.py` in git as a documented emergency tool, or move it under `scripts/` with a comment “office machine only”
- Deploy once so production no longer exposes `POST /api/seed-blob`

A public authenticated seed endpoint that can overwrite 264 companies is a loaded gun.

**A3 — Acceptance (Phase 1 closed)**

- Live still 264 / 31 / 133 / 31
- Marker test passed and reverted
- `/api/seed-blob` is **404**
- `npm run build` exit 0
- You did not send email or build a demo

Write a short note at the bottom of this file: `Phase 1 closed: <date> <commit>`.

---

### B. Phase 2 — real write buttons (only after A)

These are the last two things that still feel like a brochure.

**B1 — Add lead is a POST, not JSON paste**

Today: `src/components/add-lead-dialog.tsx` copies a JSON blob for someone to paste into `pipeline.json`.

Need:

- `POST /api/pipeline/leads` (auth via existing middleware cookie)
  - Body: `{ name, category, location, phone?, website?, priority, stage, summary? }`
  - Slug/`id` from name (same rules as the dialog)
  - **Reject 409** if `name` or `id` already exists (case-insensitive name). This is “is this company already in the dashboard?”
  - `readPipelineSafe` → push company → `writePipeline`
  - Default stage `prospect`, priority one of `high|medium-high|medium|low`
- Dialog: submit the POST, then `usePipeline().reload()` (or `router.refresh` + reload). On 409 show “Already in the dashboard” + link to `/client/<id>`.
- Do **not** keep the “copy JSON / commit / redeploy” path as the primary UX.

**B2 — Kanban drag persists**

Today: Home `handleMove` only `setCompanies` in this browser.

Need:

- `POST /api/pipeline/move` `{ companyId, stage }` (optional `index`)
- Validate `stage` is a real `StageId`
- Write Blob
- Home `handleMove`: optimistic UI, then POST; on failure reload and show error
- After a refresh on another device, the card is in the new column

**B3 — Phase 2 acceptance**

- Add a throwaway lead named `Phase2 Test Lead <timestamp>` from the live UI (no deploy). It appears on Leads + search.
- Move it to `audit` on Home. Refresh. Still `audit`.
- Delete or stage-mark that test lead so it does not stay in Zach’s inbox (add a `POST` delete **or** move it to a clearly fake name and leave a note — do not silently delete real companies).

---

### C. Do not do (still)

- Neon / Postgres “real database.” Blob is the book.
- Fleet / vault Assets on Vercel. Local-only. 503 is correct.
- Visual redesign, new nav items.
- Sending pitches or building/deploying demo sites (Supervisor only).
- “Cleaning” the 146 companies in `pitch`. Process pile, not this ticket.
- Seeding Blob from local `data/pipeline.json` (that file has drifted to 51 before).
- Coordinating via A2A with revenue-gen. Zach talks to you in **your** Telegram chat.

---

## How to deploy (when you actually need a deploy)

```bash
cd /mnt/d/LocalLaunch/dashboard
rm -rf .next
npm run build          # must exit 0
# Reconcile: live GET must still be 264 before you ship
vercel deploy --prod   # token in /home/zach/.vercel/auth.json
```

Verify:

```bash
C='Cookie: ll_dash_auth=0613'
URL=https://dashboard-eight-sage-89.vercel.app
curl -s -m 20 -H "$C" "$URL/api/pipeline/data" | python3 -c "import json,sys;d=json.load(sys.stdin);c=d['companies'];print(len(c), sum(1 for x in c if x.get('demoUrl')))"
curl -s -m 15 -H "$C" "$URL/api/demos" | python3 -c "import json,sys;print(len(json.load(sys.stdin).get('demos',[])))"
```

Expect `264 31` then `31`. If you see `51 0`, roll back the Vercel deployment immediately.

---

## Files you will likely touch

| File | Why |
|---|---|
| `src/app/api/seed-blob/route.ts` | **Delete** after A1 |
| `src/components/add-lead-dialog.tsx` | B1 |
| `src/app/api/pipeline/leads/route.ts` | B1 (create) |
| `src/app/page.tsx` | B2 hook POST into `handleMove` |
| `src/app/api/pipeline/move/route.ts` | B2 (create) |
| `src/hooks/use-pipeline.ts` | already the live client hook — extend, don’t replace |
| `src/lib/pipeline-store.ts` | already Blob R/W — reuse |

Do **not** rewrite `src/lib/data.ts` helpers unless a type is missing.

---

## Division of labor

- **You (builder / Assistant):** dashboard data plane + write buttons.
- **Supervisor:** demos (`/hallmark`) and sending approved emails.
- **revenue-gen:** prospecting / this spec. They cannot command you over A2A.

---

## Phase 1 closed

_Not yet. Fill in after A3._

<!-- Phase 1 closed: YYYY-MM-DD <commit> -->
