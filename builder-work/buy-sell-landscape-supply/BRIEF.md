# Builder Task — Buy Sell Landscape Supply LLC (fresh build on `tree-service` premium base)

You are in `/mnt/d/LocalLaunch/builder-work/buy-sell-landscape-supply/`. The premium `tree-service` template is copied here as a STRUCTURAL base (index.html + deploy.py + hero-poster.jpg + services-bg.jpg + logo.png + work-a/b/c/d.jpg, all regenerated for LANDSCAPE SUPPLY). Rebrand "Lumberjack Tree Service" (red, tree) → **Buy Sell Landscape Supply LLC** (a materials/supply business). You MAY restructure content (services→products) but KEEP the premium visual system. Graft=0 expected.

## REAL FACTS (verified — use exactly; do NOT invent)
- Business name: **Buy Sell Landscape Supply LLC**
- City: **Grand Rapids, MI** (serve "Grand Rapids & West Michigan")
- Phone: **(616) 291-1982** · tel: tel:+16162911982
- Owner: **Sue** (family-owned) — frame as "family-owned"
- Reviews: **4.4★ / 42 Google reviews** (verified). 2 verbatim quotes below.
- Slug (deploy.py PROJECT): **buy-sell-landscape-supply-demo**
- ⚠️ This is a SUPPLY business, NOT a service — the "services" section should be "Our Products" / materials.

## HERO — no video yet
Remove the `<video class="hero__video">` element (the tree footage is off-trade). Keep `<img class="hero__poster-fallback">` → **hero-poster.jpg** (supply yard) with Ken Burns. A real video comes later.

## BRAND COLORS — earthy/stone (no brand found)
Recolor RED accent (oklch hue 27) → earthy olive (hue 70):
- `--color-orange: oklch(53.8% 0.208 27)` → `oklch(58% 0.09 70)`
- `--color-orange-2: oklch(63% 0.16 27)` → `oklch(66% 0.08 70)`
- `--color-teal: oklch(55% 0.04 30)` → `oklch(58% 0.03 70)`
- `--color-neutral: oklch(55% 0.006 30)` → `oklch(55% 0.006 70)`
- `--color-focus: oklch(68% 0.17 27)` → `oklch(70% 0.08 70)`
- Recolor hardcoded gradients (hero__scrim hue 200 → 70; services-bg hue 30 → 70). Grep leftover 27/30/200 → 70. Keep neutral paper/ink hues.

## CONTENT REBRAND
- **Hero eyebrow**: "Grand Rapids, MI · Landscape Materials"
- **Hero H1**: "Everything Your Yard Needs." (or similar)
- **Hero lede**: "Rock, sand, mulch, and topsoil for your next project — load it yourself or we deliver across Grand Rapids and West Michigan."
- **Services → "Our Products"** (rename the section heading; 4 product cards):
  1. Rock & Gravel
  2. Mulch & Bark
  3. Sand
  4. Topsoil & Compost
  (Change icons to material/loader/wheelbarrow icons — NOT tree/climb icons. Add a 5th card "Delivery & Pickup" if it fits: "Load into your pickup or have it delivered to your door.")
- **Trust marquee items**: "4.4★ Rated" · "Family Owned" · "Delivery Available" · "Serving West Michigan"
- **Work gallery captions**: work-a = "Rock & Gravel" · work-b = "Mulch & Bark" · work-c = "Sand" · work-d = "Topsoil & Compost"
- **Reviews** (2 verbatim):
  1. "…always top quality product and their customer service is way beyond what anybody else offers these days. Helpful and polite." — **Verified customer**, Google (Apr 2025)
  2. (if a 2nd fits) — **Amy A.**, Yelp (May 2024)
  Show "4.4★ · 42 Google reviews" (verified).
- **About**: "Buy Sell Landscape Supply is a family-owned landscape materials yard in Grand Rapids, MI. From rock and gravel to mulch, sand, and topsoil, we supply everything your yard and garden need — with load-yourself pickup or delivery to your door."
- **Logo**: logo.png in-dir.

## HARD RULES (apply ALL)
0a. Earthy olive accent (given). No red, no tree imagery, no Local Launch teal.
2. Real HD backgrounds (hero-poster + services-bg). No plain-color cards.
3. Keep frosted-glass cards.
5. Distinct images — no tree footage/images anywhere; all 4 work images are materials.
6. No fabricated data — no invented owner/email/year/review count (42/4.4★ verified).
8. FIRST-ITERATION CORRECTNESS: recolor every red hue; no leftover tree services/icons; gallery captions match material images.
9. Review count 4.4★/42 verified — show it; no fabricated quotes beyond the 2 given.
10. Scrims stay DARK — earthy accent for ACCENTS ONLY.

## SELF-CERTIFY (end report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, no-tree-content=YES, hero-video-removed=YES, client-brand=YES (earthy olive), okLCH-hue-recolored=YES (27→70), scrims-dark=YES, no-fabricated-data=YES, checked-1280&390=NO (Supervisor verifies)."

Report concisely: what changed, final `:root` accent values, confirm no "Lumberjack"/tree content/hero.mp4 remain.
