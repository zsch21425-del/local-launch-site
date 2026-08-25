# Local Launch OS (LLOS)

Internal Next.js dashboard for Local Launch — pipeline, pitch/demo approvals, leads vs clients.

- **Live:** https://dashboard-eight-sage-89.vercel.app
- **Code:** this folder (`/mnt/d/LocalLaunch/dashboard`)
- **Handoff (architecture + gotchas):** [LLOS-HANDOFF.md](./LLOS-HANDOFF.md)

## Next build (give this to the agent)

**Read [NEXT-TO-FINISH.md](./NEXT-TO-FINISH.md) first.** Phase 1 seed + Blob reads are already live (264 / 31 / 133). Do **not** re-seed.

Remaining: prove a Blob write without a deploy, delete `/api/seed-blob`, then Phase 2 (add-lead POST + kanban persist).

Original Phase 1 brief (history only): [PHASE-1-LIVE-DATA-PLANE.md](./PHASE-1-LIVE-DATA-PLANE.md)

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
# live GET must still be 264 before shipping
vercel deploy --prod
```

See `LLOS-HANDOFF.md` for Turbopack `fs` pitfalls and the demo-lane boundary (this repo is OS code only — no client demo sites).
