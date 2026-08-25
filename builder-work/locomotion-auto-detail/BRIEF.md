# Builder Task — Locomotion Auto Detail (premium OKLCH rebuild)

You are in `/mnt/d/LocalLaunch/builder-work/locomotion-auto-detail/`. This is a full copy of the premium `tree-service` template (OKLCH colors, video hero + trust marquee + sticky-HD-bg frosted-glass cards + gallery + testimonials + contact + Local Launch footer). Rebrand it into an AUTO DETAILING shop. Edit `index.html` in place. Graft=0 expected (everything is in-dir). Do NOT touch files outside this dir.

## REAL FACTS (verified — use exactly these)
- Business: **Locomotion Auto Detail**
- City: **Anderson, SC** — service area copy = "Anderson & the Upstate"
- Phone: **(864) 749-4013** · tel link `tel:+18647494013`
- Email: **locomotionautodetail@gmail.com**
- Proof: **28 five-star Google reviews** (verified GBP count). NO fabricated quotes, NO invented star rating.
- Slug (deploy.py project name + og:url): **locomotion-auto-detail**

## BRAND COLORS (no client brand found → use a neutral premium palette, clearly swappable)
Replace the `:root` `--color-*` OKLCH tokens:
- `--color-paper` → `oklch(20% 0.003 250)` (dark charcoal)
- `--color-paper-2` → `oklch(29% 0.004 250)` · `--color-paper-3` → `oklch(34% 0.004 250)`
- `--color-ink` → `oklch(97% 0.002 146)`
- `--color-teal` (secondary) → `oklch(45% 0.02 250)` (muted cool gray)
- `--color-orange` (PRIMARY accent) → `oklch(72% 0.13 80)` (amber/gold)
- `--color-orange-2` → `oklch(78% 0.11 80)` · `--color-accent-ink` → `oklch(18% 0.003 1)` · `--color-focus` → `oklch(75% 0.12 80)`
- Recolor EVERY hardcoded hex/`rgba()`/`color-mix` left from the tree build. Scrims/overlays stay DARK charcoal; the amber is accents only (buttons, icon chips, badges, marquee dot, focus ring).

## MEDIA (already staged — reference, do NOT regenerate)
- Hero video: `hero.mp4` + `hero.webm` + `hero-poster.jpg` (polishing a black car — on-trade). Keep the `<video>` hero, no static swap, no hero logo.
- Services sticky bg: `services-bg.jpg` (dark detailing studio).
- Gallery: `work-a.jpg` (foam wash), `work-b.jpg` (interior), `work-c.jpg` (ceramic coating), `work-d.jpg` (paint correction).
- Footer: `logo-bg.jpg` (Local Launch) — keep.
- Nav brand = TEXT "Locomotion Auto Detail" (no logo image).

## SECTION CONTENT (tree → detailing)
- **Meta title**: "Locomotion Auto Detail — Anderson, SC | Auto Detailing, Ceramic Coating & Paint Correction"
- **Meta description**: "Locomotion Auto Detail in Anderson, SC — exterior, interior, ceramic coating and paint correction. 28 five-star Google reviews. Call (864) 749-4013."
- **Nav**: "Locomotion Auto Detail" + (864) 749-4013
- **Hero eyebrow**: "Anderson's Auto Detailing Studio"
- **Hero H1**: "Showroom Shine, Every Time"
- **Hero lede**: "Exterior, interior, ceramic coating and paint correction for cars across Anderson and the Upstate."
- **Trust marquee (3 VERIFIED items, replace all 5 tree items + icons)**: "28 Five-Star Google Reviews" · "Serving Anderson & the Upstate" · "Exterior · Interior · Ceramic"
- **Services lede**: "Detailing done right — from a quick wash to full paint correction."
- **Services (6 tree cards → 4 detailing cards; replace tree icons with detailing icons: droplet/foam, seat/interior, shield, sparkle):**
  1. **Exterior Detailing** — "Hand wash, clay bar, wax and polish to restore a deep, glossy finish."
  2. **Interior Detailing** — "Vacuum, shampoo, leather conditioning and deep cleaning for a like-new cabin."
  3. **Ceramic Coating** — "Long-lasting paint protection that beads water and resists the elements."
  4. **Paint Correction** — "Machine polishing to remove swirls, scratches and oxidation."
- **About H2**: "Anderson's Trusted Auto Detailing"
- **About P1**: "Locomotion Auto Detail serves Anderson and the Upstate with meticulous hand detailing — exterior, interior, ceramic coating and paint correction."
- **About P2**: "Backed by 28 five-star Google reviews, our work is built on attention to detail and care for every vehicle."
- **About stat**: "28" / "Five-Star Google Reviews" (replaces the tree's "40 Years" stat)
- **Gallery captions** (match images in order): "Exterior Wash" / "Interior Detail" / "Ceramic Coating" / "Paint Correction"
- **Testimonials**: NO fabricated quotes. Remove the tree template's verbatim quote cards and replace with ONE honest proof card: "Rated 5.0 on Google · 28 reviews" (no invented customer names or quotes).
- **Service area**: "Anderson, SC" / "the Upstate" (remove tree/arborist wording).
- **Contact**: phone (864) 749-4013, email locomotionautodetail@gmail.com, "Anderson, SC".
- **Footer**: KEEP Local Launch credit exactly (logo-bg.jpg, "Website built by Local Launch" → https://locallaunchupstate.com, (503) 358-5860, locallaunchupstate@gmail.com).

## REMOVE every trace of the tree template
Grep + eliminate ALL: "Lumberjack", "Christopher", "McCollum", "864-642-7705", "Ljtreeserviceasc@gmail.com", "tree", "Tree", "stump", "arborist", "trimming", "bucket truck", "storm", "Ken Lovingood", "Est. 2014", "12 years", "24/7". Replace tree SVG icons (i-tree, i-pruning-shears, i-stump, i-bucket-truck) with detailing icons or remove them.

## HARD RULES (apply ALL)
- NO fabricated data: real phone/email/services as given; NO invented review quotes, NO invented star rating (the 28-review count is the verified proof — cite it, don't embellish it).
- Real HD backgrounds: hero is video; services bg is `services-bg.jpg`; keep frosted-glass cards (no flat/solid cards).
- Every image distinct: gallery = 4 unique scenes; never reuse the hero poster as a gallery image.
- Scrims dark (charcoal), amber accents only.
- No CSS syntax errors; every `src`/`poster`/`url()` points to a file present in this dir.
- Self-review for text overlap / cut CTAs.

## SELF-CERTIFY (end your report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO (not a transform trade), HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=NO (neutral amber palette, swappable), colors-recolored=YES, services-bg-full=YES, scrims-dark=YES, no-fabricated-reviews=YES, no-tree-strings=YES, checked-1280&390=NO (Supervisor verifies)."

When done, report concisely: what changed, final `--color-*` values, and confirm 0 tree/Lumberjack strings remain.
