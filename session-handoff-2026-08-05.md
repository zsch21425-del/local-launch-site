# Local Launch — Session Handoff Brief (2026-08-05)

Give this to Claude (or any AI) to double-check the work done today. It covers: prospect dashboard, blog setup, weekly content automation, and pending items. Claude should verify the claims below against the actual files/sites and flag anything wrong or missing.

---

## 1. Prospect Pipeline Dashboard

**Files:** `/mnt/d/LocalLaunch/prospect-dashboard/`
- `dashboard.html` — main dashboard (dark/light theme toggle, 3 views: Pipeline kanban, Ranked table, Progress bars)
- `server.py` — local server on port **8787**; serves dashboard + API. Edits POST to `/api/prospects` and **sync back to Obsidian** at `/mnt/d/Obsidian/Local-Launch/Prospects/00 - Prospects.md`
- `prospects.json` — canonical prospect data (16 prospects)
- `build_phone.py` — builds `phone.html` (self-contained, data embedded, localStorage-only saves)
- `deploy_dashboard.py` — deploys phone version to Vercel via REST API
- `phone.html` — deployed phone version

**Live URLs:**
- Phone: `https://local-launch-prospects.vercel.app` (deployed, read/update on device)
- Desktop: `http://localhost:8787` (requires server running: `python3 /mnt/d/LocalLaunch/prospect-dashboard/server.py`)

**Stage assignments (current, corrected Aug 5):**
- Demo Built: Chandler Brothers Landscape, Manquen Automotive
- Audited: Platinum Outdoor Living, Carolina Pest Patrol, 864 Cleaning, Local Plumber & HVAC, Chisholm Plumbing, Tuck & Howell, Dipple Services, Ken's Plumbing, Carolina Paint & Body, Sanford & Son Plumbing, Sanders Heating & Cooling
- On Hold: Ground Oasis Construction
- Re-Audit: Integrity Plumbing
- Re-Pitch: Hipps Automotive

**Progress view:** horizontal bars with shared scale legend (Audited | Demo | Outreach | Contacted | Site Demo | Proposal | Paid) above each group. Flat list by default; grouped when a category chip is clicked.

**KNOWN ISSUE TO CHECK:** the phone version was rebuilt and redeployed multiple times today. Verify the deployed version at `https://local-launch-prospects.vercel.app` renders all 16 prospects with correct stages and that the progress bars match the stage data.

---

## 2. Local Launch Blog (SEO/GEO)

**Blog index:** `/mnt/d/LocalLaunch/blog.html` — live at `https://locallaunchupstate.com/blog.html`

**Posts (5 total, all in `/mnt/d/LocalLaunch/blog/`):**
1. `why-your-business-isnt-in-ai-search.html` — GEO/AI search explainer
2. `website-cost-greenville-sc.html` — website pricing (GEO)
3. `local-seo-for-trades-greenville.html` — local SEO guide
4. `plumber-cost-greenville-sc.html` — plumbing costs (GEO)
5. `landscaping-cost-greenville-sc.html` — landscaping costs (GEO)

**Each post has:** BlogPosting JSON-LD schema, canonical URL to `https://locallaunchupstate.com/blog/<slug>.html`, meta description, GEO front-loaded answer (first ~200 words), local Upstate SC specifics, CTA to `/free-demo.html`, matching site design (dark #1B1A18 / teal #2AA8A8).

**Site changes:** nav link to Blog added in `index.html`; `sitemap.xml` updated with blog URLs.

**Deployed:** `https://local-launch-site.vercel.app` (aliased from locallaunchupstate.com) via `python3 vercel_deploy.py --prod`.

**TO VERIFY:** 
- All 5 blog URLs return 200
- Sitemap includes all 5 posts + blog.html
- Schema JSON-LD is valid in each post
- Blog link appears in the main site nav

---

## 3. Weekly Blog Content Automation

**Cron job:** `Local Launch Weekly Blog Draft` (job_id `c9a347645e63`)
- Schedule: **Mondays 09:00** (next run 2026-08-10)
- Loads `local-seo-content-agent` + `humanizer` skills
- Generates ONE new GEO-optimized post, rotated topic types (GEO pricing articles first, then local SEO how-tos, AI receptionist, web design)
- Saves draft HTML to `/mnt/d/LocalLaunch/blog/<slug>.html` AND text draft to `/mnt/d/Obsidian/Local-Launch/Blog-Drafts/<slug>-DRAFT.md`
- **Never auto-publishes** — always DRAFT for Zach's review

**TO VERIFY:** cron job exists and is scheduled correctly.

---

## 4. Pending Items (NOT done yet)

1. **Pricing update** — Zach wants to change the pricing structure on the website (currently T1 $300 / T2 $300+$35/mo / T3 $350+$50/mo). New numbers NOT decided yet. His research suggested $500/$1,500/$3,000 as the eventual raise. **Do not change pricing until Zach provides the new structure.**
2. **Prospect emails** — was in the middle of finding contact emails for 10 prospects missing them. Emails already found in Obsidian audit files:
   - 864 Cleaning: office@864cleaning.com
   - Local Plumber & HVAC: localplumberllc@gmail.com
   - Dipple Services: info@dippleservices.com
   - Hipps Automotive: hippsautomotive@gmail.com
   - Carolina Paint & Body: petedixon29681@gmail.com
   - Ground Oasis: groundoasisconstruction@gmail.com (marked UNVERIFIED in audit)
   - Still missing: Chandler Brothers, Manquen, Platinum Outdoor Living, Carolina Pest Patrol, Chisholm, Tuck & Howell, Ken's, Integrity, Sanford & Son, Sanders

---

## 5. Technical Context (relevant today)

- **Model/provider:** switched to `deepseek-v4-flash` via direct DeepSeek API (Nous Portal was returning 503 "upstream capacity limits" on deepseek-v4-flash-0731 — a Nous-side issue, not local)
- **Telegram slow-after-idle:** WSL2 NAT CLOSE-WAIT issue; workaround `HERMES_TELEGRAM_HTTP_CONNECT_TIMEOUT=3.0` + `HERMES_TELEGRAM_HTTP_POOL_TIMEOUT=3.0` in `/home/zach/.hermes-local/profiles/assistant/.env`. Full notes: Obsidian `Hermes/Telegram-Timeout-WSL2-NAT.md`. Real fix (Windows 11 mirrored networking) pending Zach's OS upgrade.
- **Deploy method:** Vercel CLI hangs on this WSL; use `python3 vercel_deploy.py --prod` (site) or `python3 deploy_dashboard.py --prod` (dashboard). Never `git push` to deploy.

---

## What to Ask Claude to Do

1. Verify all blog URLs, sitemap entries, and schema markup
2. Verify the deployed prospect dashboard (phone version) matches prospects.json
3. Verify the cron job config is correct
4. Check the blog posts for AI-slop / quality issues (humanizer patterns)
5. Flag any inconsistencies in the stage data or pricing references
6. Confirm nothing was published without Zach's review

*Prepared by Hermes on 2026-08-05*
