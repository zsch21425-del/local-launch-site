# Builder Brief — Elite Sweep Property Cleaning (Kettering, OH) — PREMIUM REBUILD

Rebrand the premium tree-service template (already in this dir: `index.html`) into a **PRESSURE WASHING** demo. This is the OKLCH premium design system Zach approved (video hero + trust marquee + sticky HD bg + frosted-glass cards). **REBRAND ONLY — do NOT redesign layout/sections/CSS structure.** ONE exception: ADD the AI visualizer section (the premium template doesn't have it).

## BUSINESS DATA (VERIFIED — do NOT invent)
- Name: **Elite Sweep Property Cleaning**
- Category: **Pressure Washing** (NOT house cleaning)
- Area: **Kettering, OH & the Dayton metro**
- Phone: **(937) 776-4600** → `tel:+19377764600`
- Owner: **women-owned** (GBP-verified attribute). Do NOT invent a name.
- Reviews: **5.0★ / 8 Google reviews**. 2 verbatim quotes below (do NOT inflate).

## BRAND COLORS (OKLCH — teal/cyan clean-water palette; NO red/green/blue/navy)
The template's `:root` uses red accents. Swap the HUE to teal/cyan (keep the same lightness/chroma structure):
- `--color-orange` (primary red `oklch(0.538 0.208 27)`) → **cyan `oklch(0.72 0.13 200)`**
- `--color-orange-2` (lighter red `oklch(0.63 0.16 27)`) → **lighter cyan `oklch(0.80 0.10 200)`**
- `--color-teal` (secondary muted red-gray `oklch(0.55 0.04 30)`) → **deep teal `oklch(0.58 0.09 215)`**
- `--color-focus` (`oklch(0.68 0.17 27)`) → **`oklch(0.75 0.15 200)`**
- `--color-accent-ink` → keep dark (`oklch(0.16 0.01 200)`)
- KEEP `--color-paper` (dark bg `oklch(0.24 ...)`), `--color-paper-2/3`, `--color-ink` (white) unchanged.
- **Cyan/teal is the ONLY accent hue.** Derive lighter/darker shades. Grep for hardcoded red rgba() and replace.

## SERVICES (4 cards — use these exact labels, replace the 6 tree cards)
1. Pressure Washing (porch, deck, patio)
2. Driveway & Walkway Cleaning
3. Commercial & Grounds Cleaning
4. Parking Lot Cleaning

## TRUST MARQUEE (replace the tree proof points)
5.0★ Google Rated · 8 Reviews · Women-Owned · Free Estimates · Kettering & the Dayton Metro

## REVIEWS (2 verbatim — replace the tree review)
1. "I cannot recommend Elite Sweep enough. They cleaned our walkways, driveway, porch and deck. What a difference. Everything looks so clean and new. Shawn did an amazing job. Please don't hesitate to use this business they are totally professional and reliable." — connie thom, Google
2. "Had my first project with Elite Sweep Property Cleaning done this morning. Very impressed! Quick turn around on the quote, great communication, punctual arrival and fantastic results!" — Laura Showalter, Google

## ABOUT
Women-owned pressure washing company serving Kettering and the Dayton metro. Porches, decks, patios, driveways, walkways, commercial grounds, and parking lots. Free estimates, every time.

## IMAGES (already in this dir — wire them in)
- `pw-street-web.mp4` + `pw-street-web-poster.jpg` → hero VIDEO (autoplay/muted/loop). Poster = the video's first frame.
- `services-bg.jpg` → sticky services background (pressure-washing water spray scene)
- `svc-driveway.jpg`, `svc-siding.jpg`, `svc-patio.jpg`, `svc-commercial.jpg` → work gallery (4)
- `logo.png` → nav logo only. **NO logo in the hero.**

## VISUALIZER (ADD — port from the old build, REQUIRED)
Port the AI "Clean My Driveway" before/after slider into this template, placed AFTER the services section. Source: `/mnt/d/LocalLaunch/builder-work/elite-sweep-cleaning/index.html` — copy the `.visualizer-section` HTML + its CSS + its JS. It uses `driveway-before-real.jpg` + `driveway-after-real.jpg`, a draggable handle, and an upload button that POSTs to `/api/clean-driveway`. **Do NOT touch `api/clean-driveway.py`, `vercel.json`, or `requirements.txt`** — the serverless function must keep working.

## ZERO TEMPLATE-LEAK
No "Lumberjack", "tree", "Anderson", "Christopher McCollum", "864-642-7705", "Ljtreeserviceasc", "removal/trimming/stump" anywhere. No "licensed & insured" claim.

---

## HARD RULES (apply ALL — hard-won from many Zach rejection rounds, DO NOT omit any):
0. WORK FROM THE GRAFT GRAPH — /mnt/d/LocalLaunch has Graft wired into Claude Code. Use `graft map`, `graft grep "<term>"`, `graft ask "<symbol>"` to find conventions instead of re-reading the repo. ⚠️ For a template fork like this, graft=0 is EXPECTED and fine (everything is in-dir); just do the rebrand.
0a. CLIENT BRAND COLORS (research first, never guess) — teal/cyan is given (no brand found; clean-water palette). Do NOT use Local Launch teal/slate or the template's red.
1. VISUALIZER FOR TRANSFORM TRADES — pressure washing is a transform trade, so the before/after slider is REQUIRED and must remain functional (POST to /api/clean-driveway).
2. REAL HD BACKGROUND IMAGES on every major section. NO plain solid-color cards/sections. Every service card gets an HD trade image with a dark scrim so white text stays readable. NO flat white cards.
3. PREMIUM DEPTH CARDS — frosted glass (`backdrop-filter:blur` + `color-mix` paper), dark scrim, soft shadow, rounded corners, light text.
4. QUALITY TRADES — real video hero (autoplay/muted/loop/playsinline + poster), award-quality, NO clearly-AI imagery, NO plain look.
5. EVERY image distinct — 4 unique trade photos in gallery. No reusing the same image across sections.
6. NO SVG fake data, real phone/owner/reviews or honest placeholders, trade-specific hero video.
7. Poster = the video's exact first frame.
8. FIRST-ITERATION CORRECTNESS: (a) recolor EVERY hardcoded rgba() — not just :root; (b) services scrim fills the FULL section; (c) gallery image ⇔ caption match + on-trade; (d) no CSS syntax errors; (e) never reuse the hero poster as a gallery image.
9. NEVER CITE AN UNVERIFIED REVIEW COUNT — 8/5.0★ IS verified here, so it's fine; but do NOT fabricate any additional quote or inflate the count.
10. LIGHT BRAND COLORS → DARK SCRIMS, NOT THE BRAND COLOR — cyan/teal is a light accent; scrims/overlays must stay DARK NEUTRAL (black/charcoal). Cyan is for ACCENTS ONLY (buttons, icon chips, links, glows). Grep every `rgba()` inside background/gradient/overlay/scrim selectors → must be dark, never bright cyan.

QA before done — the 8.5 VISUAL GATE (all three in order):
  (a) `python3 /mnt/d/LocalLaunch/tools/check_redundancy.py <this dir>` via `/home/zach/hermes-agent/venv/bin/python3`;
  (b) dual-viewport visual check at 1280 AND 390 (no text overlap, no hidden-behind-scrim elements, no cut CTAs, distinct trade images);
  (c) fresh-context blind critic at the 8.5/10 bar.
If the visualizer isn't present, you are NOT done.

SELF-CERTIFY at the end: "graft-used=YES/NO, visualizer=YES, HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES (teal/cyan), rgba-recolored=YES, services-bg-full=YES, scrims-dark=YES, checked-1280&390=NO (Supervisor verifies)."
