# Fairway Client-Site Platform — Project State & Handoff
> Last updated: 2026-08-19 · Author: assistant (fleet) · Save-on-context-full handoff

## What this is
Local Launch's **client owner-editable website + analytics + self-hosted CMS** product (multi-tenant,
repeatable across clients). Fairway is the first instance. Everything below is LIVE and verified unless noted.

## LIVE endpoints
| Thing | URL | Login (password-only) |
|---|---|---|
| **CMS editor** (Directus) | https://cms.upstatewebsites.com | `zsch21425@gmail.com` / `fairway2026` |
| **Public site** (Next.js/Vercel) | https://fairway-site-ashen.vercel.app | — |
| **Analytics** (in progress → Umami) | (hand-built /analytics existed; replacing with Umami) | `fairway2026` (old) |

## Architecture (verify/reuse for new clients)
```
Public site (Vercel/Next.js) → reads content from Directus REST /items/<collection> (live)
                              → (pending) Umami tracker for analytics
Directus CMS (droplet :8055)  → nginx → 127.0.0.1:8055, behind Cloudflare proxy
Umami analytics (droplet :3000, PENDING) → nginx → 127.0.0.1:3000, behind Cloudflare
Domain: upstatewebsites.com (neutral, NOT Local Launch branded — Zach's rule)
```

## Infra / creds (DO NOT lose)
- **Droplet:** 137.184.135.50 (`ssh -i ~/.ssh/id_ed25519 root@132.184.135.50` — verify key path). Docker 29.5.2.
- **Cloudflare:** zone `upstatewebsites.com` id `dd3a541231d2024752a73dc03d022b5e`; API token `cfut_...` (**DNS-only: can manage DNS records, CANNOT create tunnels/zone settings**). Account id `90d1075dfef9e5cf1fb4b7b3c24cffd4` (Zsch21425@gmail.com's Account).
- **Neon Postgres:** shared host `ep-aged-waterfall-awf3p25s.c-12.us-east-1.aws.neon.tech`, owner creds in `/mnt/local.../crm`. Dedicated DBs: `fairway` (the Next.js site content/analytics), `directus` (Directus content), `directus`/`neondb` (CRM — NEVER reuse for clients).
- **Directus:** Docker `directus-fairway`, port 8055, Neon DB `directus`. Admin `zsch21425@gmail.com` / `fairway2026`.
- **Fairway Next.js app:** `/mnt/d/LocalLaunch/fairway-site`. Env `.env.local` (FAIRWAY_DATABASE_URL → /fairway db, FAIRWAY_ADMIN_PASSWORD=fairway2026, DIRECTUS_URL=https://cms.upstatewebsites.com). Deploys to Vercel project `fairway-site` → alias `fairway-site-ashen.vercel.app`. Deploy via `/tmp/redeploy_fairway.py` (uses supervisor VERCEL_TOKEN).

## Hard-won gotchas (ALL must be applied for future clients)
1. **Domain:** use client's own or a neutral domain — NEVER a Local Launch subdomain for a client CMS/analytics.
2. **Login:** password-only (Directus = email+password; Umami = admin/password). No Cloudflare email-allow-list unless asked.
3. **Cloudflare token:** DNS-only token CANNOT create tunnels or change zone settings. Expose services via nginx reverse-proxy + Cloudflare proxied DNS (A/CNAME), NOT cloudflared Tunnels.
4. **Postgres isolation:** ALWAYS separate DB per client — never Local Launch's CRM DB.
5. **Directus v11 RBAC:** after creating collections via API, the SQL tables may be MISSING (metadata-only) → writes return "collection does not exist" regardless of permissions. CREATE the actual SQL tables (site_content: id varchar PK + value jsonb; locations: id PK + brand/name/addr/url/image/sort). Then grant the role's ACTUAL policy (get from /roles/<roleid> → .policies[0]) read/create/update/delete. Also grant PUBLIC read on content collections so the site fetches without a token.

## Completed (verify before trusting)
- [x] Directus CMS up + exposed at cms.upstatewebsites.com (Cloudflare proxied)
- [x] Directus admin password = fairway2026
- [x] Content SQL tables created (site_content, locations) — Directus CRUD verified
- [x] Fairway content seeded in Directus (hero, about, footer, 6 locations)
- [x] Next.js getContent() reads from Directus (verified: marker injected in Directus appeared on live site)
- [x] Analytics Postgres (page_views, outbound_clicks) works

## In progress / PENDING
- [x] **Umami was WRONG CALL (over-engineering).** Zach: "seems like a waste of tokens" / "doesn't show much." We RIPPED it out of the plan. Umami is STILL RUNNING at umami.upstatewebsites.com (don't promote it) but the REAL analytics = the PREMIUM custom /analytics dashboard backed by Postgres (chart.js/react-chartjs-2). LESSON: for client analytics where data is already captured in Postgres, build a polished Chart.js dashboard — DON'T spin up a separate analytics SaaS/platform (looks empty with no traffic, wastes tokens). This is now in the skill as a pitfall.
- [x] **Premium /analytics dashboard DONE** — Chart.js (react-chartjs-2): KPI cards (page views, dealership clicks, tracking days, avg/day) + bar chart "Clicks to Each Dealership" (traffic OUT) + donut "Share of Traffic" + line "Views by Day" (traffic IN). Verified renders: 7 page views, 1 ford click, clean/modern. Login fairway2026.
- [x] Outbound-click tracking works (clicking a dealership link → /api/log-click → Postgres). Traffic-in (page_views) + traffic-out (outbound_clicks per dealership) confirmed.
- [ ] Enable Umami public share link? NO — skip; Umami superseded by the custom dashboard. Optionally delete/stop Umami container to reclaim :3055 (keep for now).
- [ ] Create a separate editor-only Directus role+user for the marketing director (password), keep zsch21425 as admin.
- [ ] Consider removing the hand-built /analytics password or making the share/workflow obvious for the director (she needs traffic-in + traffic-out view — the custom dashboard does this).

## Skill + supercontext
- Skill: `client-site-cms-platform` (productivity) — full playbook. Add Umami under its setup once deployed.
- Supercontext: `/mnt/d/Documents/Hermes Vault/.supercontext/client_cms_platform.md`.

## Proposals / emails
- Fairway proposal: `/mnt/d/Obsidian/Local-Launch/Proposals/Fairway-Auto-Website-Upgrade-2026-08-19.md` (incl. email/newsletter move-later section).
- Presentation email drafted (review: zsch21425@gmail.com) — update it with the CMS+analytics logins once Umami is live.
