# Builder Task — Holy Grounds Landscaping (fork `lawncare` template)

You are in `/mnt/d/LocalLaunch/builder-work/holy-grounds-landscaping/`. The canonical `lawncare` template is copied here (index.html + videos bg-services.mp4/reviews-bg-*.mp4 + hero poster + svc0-3.jpg + work-a-d.jpg + about.jpg + logo.png + deploy.py). TEMPLATE FORK: edit `index.html` + `deploy.py` only. Graft=0 expected. Rebrand "L And P Lawncare And Landscaping" (Spartanburg, slate-blue) → Holy Grounds Landscaping (Woodruff, green). Do NOT restructure — this template's structure (video hero spanning 2 sections + ONE continuous HD image to footer + frosted cards) is Zach's gold standard; rebrand ONLY.

## REAL FACTS (verified — use exactly; do NOT invent)
- Business name: **Holy Grounds Landscaping** (replace every "L And P Lawncare And Landscaping" / "L And P")
- City: **Woodruff, SC** (replace "Spartanburg")
- Phone: **(864) 921-6519** (replace every 612-3912) · tel: tel:+18649216519
- Reviews: **5.0★ / 39 Google reviews** (verified). ⚠️ No verbatim quotes are accessible (Google sign-in wall) — do NOT fabricate review quotes.
- Owner: unknown → frame as "family-owned" or just "serving Woodruff & the Upstate" (do NOT invent an owner name)
- Slug (deploy.py PROJECT): **holy-grounds-landscaping-demo**

## BRAND COLORS — green (researched: #406040 dark green, photo-derived)
Replace `:root` tokens:
- `--brand: #5B6F8E` (slate-blue) → `#406040` (green)
- `--brand-dark: #334154` → `#2E4A30` (dark green)
- `--brand-pale: #E8EDF3` → `#E6EFE6` (light green tint)
- `--accent: #5E8B4A` → `#6DA252` (brighter green accent; if the template's accent is already a green you may keep a green, just make it read as green)
- Any other slate-blue/blue-leaning hex in the page → shift to the green family. Grep for `#5B6F8E`, `#334154`, `#E8EDF3` and replace ALL.

## CONTENT REBRAND
- **Services (4 cards — replace L&P's "Lawn Care & Mowing / Landscaping & Design / Tree Service / Junk Removal & Hauling" with these 4 lawn-care services):**
  1. Lawn Care & Mowing
  2. Lawn Maintenance
  3. Mulching & Beds
  4. Yard Cleanup
  (The 4 service thumbs svc0-3.jpg already match these — keep them mapped in order. Remove "Tree Service" and "Junk Removal" — Holy Grounds is a lawn-care service only.)
- **Reviews section**: replace any L&P review quotes with a trust statement — "Rated 5.0 by 39 Google reviews" / "39 five-star Google reviews" — and a line like "See our Google reviews" (do NOT write fake quotes). If the template has review cards, replace their text with "5.0★ on Google · 39 reviews" + "Woodruff's trusted lawn care" (no fabricated testimonial copy).
- **About**: "Holy Grounds Landscaping is a lawn care and maintenance company serving Woodruff, SC and the surrounding Upstate. Rated 5.0 stars by 39 Google reviews, we keep lawns healthy, tidy, and looking their best." (No invented owner/year.)
- **Hero**: keep the structure; headline/lede should be Holy Grounds-flavored ("A lawn you can be proud of." / "Lawn care & maintenance in Woodruff, SC — mowing, trimming, mulching, and cleanup, done right.").
- **Gallery captions**: match the new work-a..d (mowed lawn, trimmed hedges, mulch beds, leaf cleanup).
- **Logo**: logo.png in-dir.

## HARD RULES (apply ALL)
0a. Green brand (given). No slate-blue, no Local Launch teal/slate.
2. Keep the real HD video + image backgrounds (do NOT flatten to solid color).
3. Keep the frosted-card / dark-glass pattern.
5. Distinct images — 4 service thumbs + 4 gallery + about all different (already regenerated).
6. No fabricated data — no invented owner, no invented review quotes, no invented review count (39/5.0 verified).
8. FIRST-ITERATION CORRECTNESS: recolor every slate-blue hex; no CSS syntax errors; gallery captions match the lawn images.
9. Review count 5.0★/39 verified — show exactly that, no fabricated quotes or ratings beyond it.
10. Keep the template's uniform video tint (no added overlay gradient that creates a dark-line seam).

## SELF-CERTIFY (end report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES (green #406040), slate-blue-recolored=YES, no-fabricated-quotes=YES, no-fabricated-owner=YES, checked-1280&390=NO (Supervisor verifies)."

Report concisely: what changed, final `:root` brand tokens, confirm no "L And P", "Spartanburg", "612-3912", or slate-blue #5B6F8E remain.
