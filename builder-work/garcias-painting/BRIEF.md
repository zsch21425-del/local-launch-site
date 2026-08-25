# Builder Task — Garcia's Painting Company (fresh build on `tree-service` premium base + ADD a before/after visualizer)

You are in `/mnt/d/LocalLaunch/builder-work/garcias-painting/`. The premium `tree-service` template is copied here as a STRUCTURAL base (index.html + deploy.py + logo.png + hero-poster.jpg + services-bg.jpg + work-a/b/c/d.jpg + before.jpg + after.jpg, all regenerated for PAINTING). Rebrand "Lumberjack Tree Service" (red, tree) → **Garcia's Painting Company**. KEEP the premium visual system; ADD a before/after visualizer (this is a transform trade — REQUIRED). Graft=0 expected.

## REAL FACTS (verified — use exactly; do NOT invent)
- Business name: **Garcia's Painting Company**
- City: **Fort Wayne, IN** (serve "Fort Wayne & Northeast Indiana")
- Phone: **(260) 600-8628** · tel: tel:+12606008628
- Owner: **Miguel** (Latino-owned; free estimates in English/Spanish)
- Reviews: ~9 Google reviews. 2 verbatim quotes below. Do NOT cite a specific star count.
- Slug (deploy.py PROJECT): **garcias-painting-demo**

## HERO — no video yet
Remove `<video class="hero__video">` (tree footage is off-trade). Keep `<img class="hero__poster-fallback">` → **hero-poster.jpg** (painter rolling a wall) with Ken Burns. A real painting video comes later.

## BRAND COLORS — warm terracotta/clay (no brand found)
Recolor RED accent (oklch hue 27) → terracotta (hue 38):
- `--color-orange: oklch(53.8% 0.208 27)` → `oklch(56% 0.13 38)`
- `--color-orange-2: oklch(63% 0.16 27)` → `oklch(64% 0.12 38)`
- `--color-teal: oklch(55% 0.04 30)` → `oklch(56% 0.04 38)`
- `--color-neutral: oklch(55% 0.006 30)` → `oklch(55% 0.006 38)`
- `--color-focus: oklch(68% 0.17 27)` → `oklch(68% 0.12 38)`
- Recolor hardcoded gradients (hero__scrim hue 200 → 38; services-bg hue 30 → 38). Grep leftover 27/30/200 → 38. Keep neutral paper/ink hues.

## CONTENT REBRAND
- **Hero eyebrow**: "Fort Wayne, IN · Painting Done Right"
- **Hero H1**: "A Fresh Coat. A Fresh Look."
- **Hero lede**: "Interior and exterior painting, drywall repair, and cabinet refinishing across Fort Wayne — free estimates in English or Spanish."
- **Services (4 cards, replace tree services):**
  1. Interior Painting (walls, ceilings & trim)
  2. Exterior Painting (incl. aluminum siding)
  3. Drywall & Sheetrock Repair
  4. Cabinet & Vanity Painting
  (Change icons to roller/brush/paint icons — NOT tree/climb icons.)
- **Trust marquee items**: "Free Estimates" · "English & Español" · "Serving Fort Wayne & Northeast Indiana" · "Residential & Commercial"
- **Work gallery captions**: work-a = "Interior Painting" · work-b = "Exterior Painting" · work-c = "Drywall Repair" · work-d = "Cabinet Painting"
- **Reviews** (2 verbatim):
  1. "We had ceilings, walls, trim and some bathroom vanities painted. They were also able to get some sheetrock repair completed for us. Everything turned out well… Miguel kept us updated about the timing of the project." — **Wesley Deiss**, Google
  2. "Had them repaint our old aluminum siding, they made it look brand new… Will give them a call next time we need something painted." — **Marc Grillot**, Google
- **About**: "Garcia's Painting Company is a Fort Wayne, IN painting company led by Miguel. Interior and exterior painting, drywall repair, and cabinet refinishing — done right, with free estimates in English and Spanish."
- **Logo**: logo.png in-dir.

## ADD a BEFORE/AFTER VISUALIZER (REQUIRED — transform trade)
Insert a new `<section class="visualizer" id="visualizer">` between Services and Work Gallery (or after Reviews), matching the dark premium look. It compares **before.jpg** (aged/worn wall) vs **after.jpg** (freshly painted wall) — the two images are already pixel-aligned. Implement a drag slider:
- Container `.ba` (position:relative, aspect-ratio ~16/10, border-radius, overflow hidden).
- `<img class="ba__after" src="after.jpg">` fills the container (the "after" = base).
- `<div class="ba__before">` (position:absolute, top/left/bottom 0, width:50%, overflow:hidden) containing `<img class="ba__before-img" src="before.jpg">` sized to the CONTAINER width (so it doesn't squish) — use `width: <container-width>px` via CSS `width: calc(100% * ...)` or set the img width in JS to the container's pixel width.
- A vertical `.ba__handle` line + a circular grab button, draggable via pointer events. On drag, update `.ba__before` width + handle position (clamp 0–100%).
- Section heading: "See the Difference" + lede "Drag to compare — before and after a Garcia's paint job."
- Labels "Before" (top-left of the before layer) and "After" (top-right).
- Works on touch (pointer events) AND is keyboard-accessible (left/right arrows on the handle).

## HARD RULES (apply ALL)
0a. Terracotta accent (given). No red, no tree imagery, no Local Launch teal.
1. VISUALIZER IS REQUIRED — the before/after slider must be present and functional (drag/pointer + keyboard). Do NOT omit it.
2. Real HD backgrounds (hero-poster + services-bg). No plain-color cards.
3. Keep frosted-glass cards.
5. Distinct images — no tree footage/images; all work images are painting scenes.
6. No fabricated data — no invented owner (Miguel verified), no invented review count, no "licensed & insured" claim unless stated.
8. FIRST-ITERATION CORRECTNESS: recolor every red hue; no leftover tree services/icons; gallery captions match painting images; slider JS has no syntax errors.
9. Do NOT cite a star rating (unverified) — use the 2 real quotes only.
10. Scrims stay DARK — terracotta for ACCENTS ONLY.

## SELF-CERTIFY (end report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=YES (before/after slider, drag + keyboard), HD-bg=YES, premium-cards=YES, distinct-images=YES, no-tree-content=YES, hero-video-removed=YES, client-brand=YES (terracotta), okLCH-hue-recolored=YES (27→38), scrims-dark=YES, no-fabricated-data=YES, checked-1280&390=NO (Supervisor verifies)."

Report concisely: what changed, final `:root` accent values, confirm the visualizer slider is present + functional, and no "Lumberjack"/tree content/hero.mp4 remain.
