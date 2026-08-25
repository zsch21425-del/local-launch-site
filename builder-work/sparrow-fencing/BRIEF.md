# Builder Task — Sparrow Fencing LLC (fresh build on `tree-service` premium base)

You are in `/mnt/d/LocalLaunch/builder-work/sparrow-fencing/`. The premium `tree-service` template is copied here as a STRUCTURAL base (index.html + deploy.py + hero-poster.jpg + services-bg.jpg + logo.png + work-a/b/c/d.jpg, all regenerated for FENCING). The template is branded "Lumberjack Tree Service" (red accent, tree services) — rebrand it fully to **Sparrow Fencing LLC**. You MAY restructure content (services/icons/copy) since this is a cross-trade build, but KEEP the premium visual system (video/poster hero, sticky HD services-bg, frosted-glass cards, trust marquee, work gallery, about, reviews, CTA). Graft=0 expected.

## REAL FACTS (verified — use exactly; do NOT invent)
- Business name: **Sparrow Fencing LLC**
- City: **Greer, SC** (serve "Greer, Pelzer & the Upstate")
- Phone: **(864) 662-8867** · tel: tel:+18646628867
- Owner: unknown → do NOT invent an owner name; use "locally owned" framing
- Reviews: **349 Google reviews** (verified). 1 verbatim quote below.
- Slug (deploy.py PROJECT): **sparrow-fencing-demo**

## HERO — IMPORTANT (no fencing video yet)
The template ships a TREE video (hero.mp4/webm) — that footage is off-trade. **Remove the `<video class="hero__video">` element entirely** (do not reference hero.mp4/webm). Keep the `<img class="hero__poster-fallback">` pointing at **hero-poster.jpg** (a cedar fence — already in-dir) so the Ken Burns zoom runs on the poster until a real fencing video is added later. The poster fallback must still animate (kenburns) and be full-bleed.

## BRAND COLORS — warm cedar/charcoal (no brand found; neutral premium)
Recolor the RED accent (oklch hue 27) → warm cedar (hue 55):
- `--color-orange: oklch(53.8% 0.208 27)` → `oklch(58% 0.11 55)` (cedar)
- `--color-orange-2: oklch(63% 0.16 27)` → `oklch(66% 0.10 55)`
- `--color-teal: oklch(55% 0.04 30)` → `oklch(58% 0.04 55)`
- `--color-neutral: oklch(55% 0.006 30)` → `oklch(55% 0.006 55)`
- `--color-focus: oklch(68% 0.17 27)` → `oklch(70% 0.10 55)`
- Recolor hardcoded gradients: `.hero__scrim` oklch hue 200 → 55; `.services-bg` gradient hue 30 → 55. Grep for leftover oklch hues 27/30/200 → 55. Leave paper/ink neutral hues (1, 146, 326) untouched.

## CONTENT REBRAND
- **Hero eyebrow**: "Greer, SC · Fencing Done Right"
- **Hero H1**: "Fences Built To Last." (accent word optional)
- **Hero lede**: "Wood, vinyl, chain-link, and aluminum fences for homes across Greer, Pelzer, and the Upstate — installed clean and built to last."
- **Services (map to 4 real fencing services — drop the tree ones):**
  1. Wood Privacy Fences
  2. Vinyl Fences
  3. Chain-Link Fences
  4. Aluminum & Ornamental Fences
  (Update the service-card icons from tree/climb icons to fence/gate/rail icons — use simple inline SVG or unicode; do NOT use tree icons.)
- **Trust marquee items**: "349 Google Reviews" · "Free Estimates" · "Serving Greer & the Upstate" · "Built To Last"
- **Work gallery captions** (match the 4 fence images): work-a = "Wood Privacy Fence" · work-b = "Vinyl Fence" · work-c = "Chain-Link Fence" · work-d = "Aluminum & Ornamental"
- **Reviews**: replace the tree review with Sparrow's verified quote: "Five stars for Sparrow Fencing — and if I could build more stars, I'd hire them to fence those in..." — **Verified customer**, Yelp. Show "349 Google reviews" (verified) as the trust line.
- **About**: "Sparrow Fencing LLC is a Greer, SC fencing company serving Greer, Pelzer, and the Upstate. From wood privacy to aluminum and ornamental, we install clean, durable fences that last." (No invented owner/year.)
- **Logo**: logo.png in-dir (replace tree logo references).

## HARD RULES (apply ALL)
0a. Warm cedar accent (given). No red, no tree imagery, no Local Launch teal.
2. Real HD backgrounds (hero-poster + services-bg). No plain-color cards.
3. Keep the frosted-glass card pattern.
5. Distinct images — hero-poster (fence) + services-bg (cedar texture) + 4 work images all different; NO tree footage/images anywhere.
6. No fabricated data — no invented owner/email/year/review count (349 verified).
8. FIRST-ITERATION CORRECTNESS: recolor every red/warm hue; no CSS syntax errors; no leftover tree service names or tree icons; gallery captions match fence images.
9. Review count 349 verified — show it; do not fabricate additional quotes.
10. Scrims stay DARK — cedar is for ACCENTS ONLY.

## SELF-CERTIFY (end report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO (fencing is not a transform trade), HD-bg=YES, premium-cards=YES, distinct-images=YES, no-tree-content=YES, hero-video-removed=YES (poster Ken Burns only), client-brand=YES (warm cedar), okLCH-hue-recolored=YES (27→55), scrims-dark=YES, no-fabricated-data=YES, checked-1280&390=NO (Supervisor verifies)."

Report concisely: what changed, final `:root` accent values, confirm no "Lumberjack", tree service names, tree icons, or hero.mp4 references remain.
