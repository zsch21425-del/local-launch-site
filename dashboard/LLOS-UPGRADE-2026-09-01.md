# LLOS upgrade note — 2026-08-31 / 2026-09-01

Coordinated with **default agent** (A2A :9901). Deployed production.

## Shipped
- Cold-call sheet + `PATCH /api/pipeline/leads/[id]` (ownerName, offer, phone, email, responseStatus)
- Company-card send-status + owner/offer badges
- `/automation` nav (n8n / LibreCrawl / Patter)
- Reports page → `usePipeline` (live Blob, not bundled snapshot)
- `resolveDemoUrl` hard rule: never invent `<slug>-demo.vercel.app`
- `getStages()` accepts flat Blob shape **and** nested `pipeline.stages` (fixed Vercel prerender crash)
- CRM mirror cap 50 → 500
- Live Blob: scrubbed 13 dead demoUrls; backfilled **50 ownerName** from name_lookup results
- Live book now: **264 companies / 18 demoUrl / 50 ownerName**

## Backup
`data/pipeline.live-upgrade-backup-2026-08-31.json`

## Still open (not blockers)
- 12 null `pitchDraft.status` (default holding write for go)
- 227 missing emails (enrichment backlog)
- CRM droplet :3001 timeout from WSL — drift list blocked
- Blob read-after-write lag 5–20s (known)

## Acceptance
- Live pages 200, seed-blob 404, build green, no pitches/demos sent as part of this ticket
