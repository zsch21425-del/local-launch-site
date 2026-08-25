# Local Launch OS (LLOS)

Internal Next.js dashboard for Local Launch — pipeline, pitch/demo approvals, leads vs clients.

- **Live:** https://dashboard-eight-sage-89.vercel.app
- **Code:** this folder (`/mnt/d/LocalLaunch/dashboard`)
- **Handoff (architecture + gotchas):** [LLOS-HANDOFF.md](./LLOS-HANDOFF.md)

## Next build (Minimax / any agent)

**Do not start features until Phase 1 is done.**

The UI is not a full OS yet. Company lists are a **snapshot baked in at deploy**. Writes go to Vercel Blob (or nowhere). Those two books have already drifted (264 live vs 51 on Blob).

Read and follow, in order:

1. **[PHASE-1-LIVE-DATA-PLANE.md](./PHASE-1-LIVE-DATA-PLANE.md)** — why Phase 1 matters, seed rules, file-by-file flips, acceptance curls. **Seed Blob only from the live 264-company API. Never from a 51-company local file.**
2. Phase 2 (add-lead POST, kanban persist) is listed at the bottom of that spec. Out of scope until Phase 1 is green.

## Local dev

```bash
cd /mnt/d/LocalLaunch/dashboard
npm install
npm run dev
```

`data/pipeline.json` is gitignored. `BLOB_READ_WRITE_TOKEN` and `ACCESS_CODE` live in `.env.local` (never commit).

## Deploy

```bash
cd /mnt/d/LocalLaunch/dashboard
# confirm local companies === 264 before shipping
python3 -c "import json;print(len(json.load(open('data/pipeline.json'))['companies']))"
vercel deploy --prod
```

See `LLOS-HANDOFF.md` for Turbopack `fs` pitfalls and the demo-lane boundary (this repo is OS code only — no client demo sites).
