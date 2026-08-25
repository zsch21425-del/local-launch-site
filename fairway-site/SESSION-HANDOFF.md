# FAIRWAY CLIENT-SITE DEMO — FULL SESSION HANDOFF
> Created: 2026-08-20 · Purpose: resume cleanly in a new session / copy-paste to new Zach chat

## STATUS: Everything below is LIVE and verified.

## The goal (Zach restated 2026-08-20)
Fairway is NOT an actual client — run the Fairway demo site to SHOW them what Local Launch can do and PROVE it can get traffic. Do NOT add Fairway to Local Launch's own site (I added a backlink then reverted it after Zach corrected me; Local Launch's portfolio = only Redwood/Mom&Mop/CC Headlight). Keep the demo neutral (it's on upstatewebsites.com, not Local Launch-branded).

## LIVE endpoints (password-only)
| Thing | URL | Login |
|---|---|---|
| Fairway demo site | https://fairway.upstatewebsites.com | public |
| CMS (Directus, owner-editable) | https://cms.upstatewebsites.com | `zsch21425@gmail.com` / `fairway2026` |
| Analytics dashboard | https://fairway-site-ashen.vercel.app/analytics | `fairway2026` |
| (alt site alias) | https://fairway-site-ashen.vercel.app | public |
| Umami (abandoned/over-engineered) | https://umami.upstatewebsites.com | admin/umami — DO NOT promote; superseded by custom /analytics |

## Architecture
- Public site = Next.js App Router at **/mnt/d/LocalLaunch/fairway-site** (Vercel project `fairway-site`, prod alias `fairway.upstatewebsites.com` + `fairway-site-ashen.vercel.app`).
- Content read from **Directus CMS** (lib/db.ts getContent() → https://cms.upstatewebsites.com/items/site_content + /items/locations).
- Analytics = **custom Chart.js dashboard** (react-chartjs-2) reading Postgres `page_views` + `outbound_clicks` (traffic-IN + traffic-OUT per dealership). Deploy via `/tmp/redeploy_fairway.py` (uses supervisor VERCEL_TOKEN).
- Backend infra: DO droplet 137.184.135.50 (Docker containers: `directus-fairway` :8055, `umami` :3055), Neon Postgres (DBs `fairway` = site analytics, `directus` = CMS content).

## SEO/GEO — SUBMITTED TO GOOGLE (get traffic proof)
- robots.txt (allows AI bots), sitemap.xml, JSON-LD AutoDealer schema — ALL live on fairway.upstatewebsites.com.
- **Google Search Console verified:** property `sc-domain:upstatewebsites.com` (owner verified by Zach). Service account `local-launch-seo@fairway-dashboard-493323.iam.gserviceaccount.com` granted **Full** user on it.
- Sitemap submitted + URL index requested (script: `/mnt/d/Hermes/hermes-home/scripts/local-launch-seo/fairway_gsc_submit.py` — for the SITEMAP/INSPECT to work, target `sc-domain:upstatewebsites.com`, NOT the URL-prefix `https://fairway.upstatewebsites.com/`, because the SA only has Full on the sc-domain property. Run with DO_ADD=1 DO_SM=1 DO_INSPECT=1).
- GSC "URL is unknown to Google" was the expected first state — indexing takes 1–3 days. Check GSC Overview for the page to flip to indexed.

## Traffic-driving for the demo (Zach asked for GBP walkthrough)
CLEANEST (no fake client claim): put the demo URL in each Fairway dealership's **Google Business Profile** Website field:
- URL to use: `https://fairway.upstatewebsites.com`
- Walkthrough (Zach couldn't do GBP himself → give them this):
  1. Go to https://business.google.com and sign in to the account that manages the dealership's listings (Fairway Ford, Subaru, Lincoln, Ford Pro).
  2. Pick a location (e.g. "Fairway Ford").
  3. Click **Edit profile → Contact** (or **Info/About** section).
  4. Find the **Website** field.
  5. Paste `https://fairway.upstatewebsites.com`
  6. **Save/Publish**.
  7. Repeat for each dealership listing.
- This drives real local-search clicks to the demo → analytics shows movement.

## LESSONS (important to reuse)
1. **Don't over-engineer analytics:** data already in Postgres → build a Chart.js dashboard (react-chartjs-2). Umami was wasted tokens (looked empty). This is a skill pitfall now.
2. **Don't add non-clients to Local Launch's site** (Zach corrected me). Only actual signed clients go in the portfolio. Fairway = prospect → keep off LL site.
3. **Client CMS/analytics NOT on Local Launch-branded domains** — use the client's own or a neutral domain (upstatewebsites.com).
4. **Directus v11 gotcha:** collections created via API may lack the SQL table → "collection does not exist". Create the table + grant the role's ACTUAL policy (from /roles/<roleid> → .policies[0]).
5. **Cloudflare DNS-only token** can't create tunnels/zone settings. Expose services via nginx reverse-proxy + proxied DNS (A/CNAME). GSC SA must be granted Full on the sc-domain property, not just added, for sitemap/inspect.

## Key files
- Fairway repo: `/mnt/d/LocalLaunch/fairway-site` (PROJECT-STATE.md in it has this too)
- GSC submit: `/mnt/d/Hermes/hermes-home/scripts/local-launch-seo/fairway_gsc_submit.py`
- Deploy helper: `/tmp/redeploy_fairway.py`
- Skill: `client-site-cms-platform` (productivity) + references/umami-analytics.md + the analytics lesson
- Supercontext: `/mnt/d/Documents/Hermes Vault/.supercontext/client_cms_platform.md`
- Traffic plan: `/home/zach/fairway-traffic-acquisition-plan.md` (NEEDS re-reading; verify relevance — the GBP + GSC parts still valid)
- GEO content spec: `/home/zach/fairway_geo_content_spec.md` (answer-first FAQ blocks to add to Directus + render in page.tsx — NOT yet done)

## TODO / next steps (when resuming)
1. Give Zach the **GBP walkthrough** to drive demo traffic (the main ask).
2. (optional) Add the GEO content blocks (from fairway_geo_content_spec.md) into Directus site_content + render in page.tsx so AI can cite richer content.
3. Re-check GSC — the page should flip to "indexed" soon; that's the "proves it gets traffic/found" proof point.
4. Do NOT create a marketing-director editor login yet unless Zach wants (he wanted password-only; current admin = zsch21425/fairway2026 works for demo).

## ✅ DONE 2026-08-20 (assistant): Backend SEO/GEO deepened + GEO content rendered (deployed + verified live)
- **Schema upgraded in app/layout.tsx** (JSON-LD still 1 valid block): added `aggregateRating` (4.6★/4,131), `sameAs` (fb+ig), expanded `areaServed` to 11 Upstate cities, added `hasOfferCatalog` (5 services: new/pre-owned sales, service&repair, collision, commercial). Verified live.
- **GEO content sections added to app/page.tsx** (static, answer-first, per fairway_geo_content_spec.md): `#best-ford-dealer` (best-rated Ford + comparison vs George Coleman/Benson), `#service-areas` (11 cities + chips), `#faq` (6 answer-first Q&A), `#trust-stats` (4.6★/4,131/reviews/since 1966/6 locations) + `#why` reorder. CSS added to globals.css (Fairway blue/tan). Verified live: NAP (phone/address/city) present in all new sections matching schema.
- **Deployed** via /tmp/redeploy_fairway.py → aliased https://fairway.upstatewebsites.com (exit 0). Build clean (no type/lint errors).
- **IMPORTANT (Zach's plan, 2026-08-20):** Zach wants to SELF-PROMOTE the demo WITHOUT the dealership for a week, capture the outbound clicks to dealership sites, then pitch Fairway "our site pushed this much traffic to your dealerships." Do NOT spend on ads or add Fairway to LL site without his explicit go-ahead. Fresh subdomain won't organically rank for competitive terms in a week — be honest about that. Decision pending: HOW to seed traffic (paid ads vs citations/social vs just-indexing).

## 📣 INDEXING + SMALL-AD ESTIMATE (2026-08-20, assistant gave Zach)
- **Indexing:** sitemap re-submitted to verified `sc-domain:upstatewebsites.com` (200 OK) — that's the indexing trigger; Google will re-crawl the updated page from the sitemap. **URL-Inspection "Request Indexing" nudge is NOT available to automation** — SAs lack a verified URL-prefix property (SA is only siteFullUser on sc-domain; the URL-prefix `https://fairway.upstatewebsites.com/` is siteUnverifiedUser → 403 on inspection). If a manual "Request Indexing" nudge is wanted, Zach clicks it in GSC.
- **Small-ad estimate (for demo traffic, NOT launched — needs Zach approval):** best vehicle = **Google Search Ads** (intent-matched "ford dealer greenville sc") — NOT Facebook (FB ≠ search intent; only good for LL's own lead-gen). Benchmark auto-dealer CPC ≈ **$3–8/click**. Budget ≈ **$50–100/week → ~10–20 real clicks/week** to the demo URL (each then clickable through to a dealership site = the proved-traffic metric). CPC/volume are estimates to confirm at launch (live data needs Firecrawl/web tools which are not configured this session).
- **Citations: steer away for Fairway** — submitting third-party directory listings under the dealership's brand without their authorization risks misrepresenting/touching their reputation. Low value for a fresh subdomain anyway.
