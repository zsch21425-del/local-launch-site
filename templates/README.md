# Local Launch — Canonical Template Index (SINGLE SOURCE OF TRUTH)

**Read this before building ANY demo. Do not guess. Do not rebuild from scratch.**
If a trade is listed → copy that template, rebrand ONLY (colors, name, phone, services, reviews, images, logo).

---

## Trade → Template map

| Trade | Canonical template | Status |
|---|---|---|
| **Landscaping / lawn care / hardscaping** | `templates/lawncare/` | ✅ CANONICAL — approved 2026-08-19 (video 2-section + HD image to footer + dark glass) |
| **Handyman / maintenance / home repair** | `templates/handyman/` | ✅ CANONICAL (pure handyman — mixed-trade base replaced 2026-08-23, Joshua Truitt) |
| **Junk removal / hauling** | `templates/junk-removal/` | ✅ CANONICAL |
| **Pressure washing / soft wash** | `templates/pressure-washing/` | ✅ CANONICAL (premium OKLCH — video hero + sticky VIDEO bg + frosted cards + AI visualizer, approved 2026-08-22) |
| **Tree service** | `templates/tree-service/` | ✅ CANONICAL (premium — video hero + sticky HD bg + glass cards, approved 2026-08-21) |
| **Cleaning (home/commercial)** | `templates/cleaning/` | ✅ CANONICAL (premium — video hero + sticky HD bg + glass cards, refreshed 2026-08-23 Marshall Cleaning) |
| **Gutter cleaning** | `templates/gutter-cleaning/` | ✅ CANONICAL (⚠️ strip "Carolina Gutter Co." placeholder) |
| **Pest control** | `templates/pest-control/` | ✅ CANONICAL |
| **Plumbing** | `templates/plumbing/` | ✅ CANONICAL (premium OKLCH — video hero + sticky HD bg + frosted cards + 4 service cards, approved 2026-08-22) |
| **Roofing** | `templates/roofing/` | ✅ CANONICAL (static-hero + HD image to footer, dark glass — upgraded 2026-08-21) |
| **Concrete / masonry / hardscaping** | `templates/concrete/` | ✅ CANONICAL (video hero + trust marquee + work gallery, OKLCH dark premium — refreshed 2026-08-23 Gray Wolf; **paver-sealing variant = `builder-work/spartan-paver-sealing/`**) |
| **Auto detailing** | `templates/auto-detailing/` | ✅ CANONICAL (premium OKLCH — video hero + sticky HD bg + frosted cards + 4 service cards, approved 2026-08-23) |
| **Auto body / auto repair** | `templates/auto-body/`, `templates/auto-repair/` | ⚠️ older static-hero |
| **Painting (interior/exterior)** | `templates/painting/` | ✅ CANONICAL (premium OKLCH — video hero + sticky HD bg + frosted cards + before/after visualizer, refreshed 2026-08-23 Leo's) |

## Key rules
1. **Landscaping/lawn = `templates/lawncare/`** (the L&P build Zach approved 2026-08-19). Structure: **video hero (fixed) spanning 2 sections** (hero + services) with a **uniform dark tint on the video** (`filter: brightness(0.86)`, NO overlay gradient — that creates a visible dark-line seam); then **ONE continuous HD image** (`<div class="image-wrap">`) from gallery → reviews → about → CTA → footer; **no white section backgrounds**. Full rules in its `TEMPLATE-BRIEF.md`.
2. **Every canonical demo has a VIDEO hero** (`<video class="hero-bg">`), NOT a static `<div>`. When rebranding, replace the hero video + poster with the client's own — never delete the video and drop in a static image.
3. **Rebrand = change ONLY**: brand colors, business name, phone, services list, reviews (verbatim only), images, logo/icon. Do NOT redesign sections.
4. **Verify after every rebrand**: enumerate all `src`/`poster`/`url()` refs and HTTP-check each returns 200 against the live URL. Screenshots alone miss broken media.

## Demo locations (3 dirs — don't confuse them)
- `templates/` → reusable canonical templates (start here).
- `builder-work/` → individual client demo builds (in-progress + shipped).
- `demos/` → older/legacy demos (pre-builder-work).

*Updated 2026-08-23. If a trade isn't here, ASK before building.*
