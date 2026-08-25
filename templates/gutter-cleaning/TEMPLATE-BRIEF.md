# Builder Brief — Gutter Cleaning TEMPLATE (create new)

You are the BUILDER. Create a clean GUTTER CLEANING template in `/mnt/d/LocalLaunch/templates/gutter-cleaning/`. The directory is seeded with a copy of the `cleaning` template's `index.html` + `deploy.py` — REBRAND it for a gutter-cleaning business.

## REBRAND (cleaning → gutter cleaning)
- Remove all residential-cleaning-specific content (apartment/house-cleaning copy) and replace with gutter-cleaning content.
- 4 SERVICE CARDS (gutter trade):
  1. Gutter Cleaning
  2. Gutter Guard Installation
  3. Downspout Clearing
  4. Gutter Repair & Maintenance
- Hero headline idea: "Clean Gutters, Protected Home." Sub: "Gutter cleaning, guards, and repairs — done right, done safely."
- NO fabricated facts: use honest generic copy + `$` placeholders for pricing (never invent).

## ASSETS
Only these exist in the dir for now: `brand-placeholder.jpg`, `logo-bg.jpg`, and the seeded `index.html`. The trade-specific hero video + service images are being generated separately — for now, reference placeholder asset names that a later asset pass will drop in (`hero.mp4`, `hero-poster.jpg`, `svc-gutter-clean.jpg`, `svc-guard.jpg`, `svc-downspout.jpg`, `svc-repair.jpg`, `about.jpg`). Keep every `<img>`/`<video>` src pointing at these filenames so they resolve once assets land.

## HARD RULES (apply ALL)
- Gutter cleaning is NOT a transform trade — no before/after visualizer needed.
- REAL HD trade images on every section. Every service card = HD image + dark scrim + white text. NO flat/plain-color cards.
- Premium light-on-dark depth cards (near-white rgba(255,255,255,0.92), blur, soft shadow, 18-22px radius).
- Every image DISTINCT (services=4 unique, gallery=4 different, about=own). No reuse.
- NO SVG, NO fake data, NO people in imagery.
- Poster = video's first frame.
- Use graft (`graft grep`/`graft map`) to find the deploy.py + template conventions; don't re-explore the repo.

## OUTPUT
Report: cleaning text removed, 4 gutter services present, asset filenames wired, placeholders empty (grep `{{[A-Z_0-9]*}}` = 0). End with:
SELF-CERTIFY: "graft-used=YES/NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, no-people=YES, checked-1280&390=YES".
