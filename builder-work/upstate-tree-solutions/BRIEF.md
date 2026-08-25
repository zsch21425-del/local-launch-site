# Builder Task — Upstate Tree Solutions (fork `tree-service` premium template)

You are in `/mnt/d/LocalLaunch/builder-work/upstate-tree-solutions/`. The premium `tree-service` template is copied here (index.html + hero.mp4/webm + hero-poster.jpg + services-bg.jpg + logo.png + work-a/b/c/d.jpg + deploy.py). This is a TEMPLATE FORK: edit `index.html` + `deploy.py` only. Graft=0 is expected. The template is currently branded "Lumberjack Tree Service" (red accent) — rebrand to Upstate Tree Solutions (green accent). Do NOT restructure sections — rebrand ONLY.

## REAL FACTS (verified — use exactly)
- Business name: **Upstate Tree Solutions** (nav/hero/title — replace every "Lumberjack Tree Service")
- City: **Anderson, SC** (both are Anderson — keep) · Service area: "Anderson, Williamston, Belton, Powdersville, Piedmont & Honea Path"
- Phone: **(864) 221-2435** (replace every 864-642-7705) · tel: tel:+18642212435
- Email (footer/contact if present): **devinwithtreesolutions@gmail.com** (replace Ljtreeserviceasc@gmail.com)
- Owner: **Devin Woessner** (replace "Christopher McCollum")
- Reviews: **430 Google reviews, 5.0★** (verified)
- Slug (deploy.py PROJECT): **upstate-tree-solutions-demo**
- Family owned & operated. ⚠️ Do NOT claim "Est. 2014" or "12 years in business" (that was Lumberjack's unverified claim) — replace with "Family owned & operated" only.

## BRAND COLORS — green accent (researched: dark green #006020 + black). Recolor red → green.
Replace these `:root` OKLCH tokens (change the HUE, keep the premium dark look):
- `--color-orange: oklch(53.8% 0.208 27)` → `oklch(58% 0.15 152)`  (green accent)
- `--color-orange-2: oklch(63% 0.16 27)` → `oklch(66% 0.13 152)`
- `--color-teal: oklch(55% 0.04 30)` → `oklch(55% 0.04 152)`
- `--color-neutral: oklch(55% 0.006 30)` → `oklch(55% 0.006 152)`
- `--color-focus: oklch(68% 0.17 27)` → `oklch(68% 0.13 152)`
- Also recolor the HARDCODED gradients that carry the old warm/blue hue: the hero `.hero__scrim` uses `oklch(10% 0.01 200…)` and `oklch(9% 0.014 200…)` → change hue 200 → 152; the `.services-bg` gradient uses `oklch(12% 0.01 30…)` and `oklch(9% 0.012 30…)` → change hue 30 → 152.
- Grep for any remaining `27)` / ` 30)` / ` 200)` hue remnants inside oklch() and make them green-hue (152) where they were the accent/warm/blue. Do NOT touch the neutral paper/ink hues (1, 146, 326) — those are the near-black paper and off-white ink, keep them.

## CONTENT REBRAND
- **Hero eyebrow**: "Anderson, SC · Tree Removal & Pruning"
- **Hero display (H1)**: "Trees Down. Worries Gone." (or keep the template's headline structure but make it Upstate Tree's)
- **Hero lede**: "Tree removal, trimming, stump grinding, and storm cleanup across Anderson and the Upstate — done safe, done right, by a family-owned crew."
- **Services (the template has 6 cards — map to these 5 real services, dropping any that don't fit):**
  1. Tree Removal & Hazardous Trees
  2. Tree Trimming & Pruning
  3. Stump Grinding
  4. Storm Damage Cleanup
  5. Emergency Tree Service (24/7)
  (If the template has a 6th card, repurpose or remove it so only these 5 real services remain.)
- **Trust marquee items**: "430 Google Reviews" · "5.0 Rated" · "Free Estimates" · "Family Owned & Operated" · "Serving Anderson & the Upstate"
- **Work gallery (work-a..d) — captions must match the new images**: work-a = "Tree Removal" · work-b = "Trimming & Pruning" · work-c = "Stump Grinding" · work-d = "Storm Cleanup". (The 4 images are already regenerated in-dir; just fix the captions/alt text.)
- **Reviews / testimonials**: replace Lumberjack's 1 verbatim review with Upstate Tree's verified quote: "They are the best! Excellent work and very reasonable prices." — **Gloria Hackett**, Facebook. Show the 430-review / 5.0★ trust line (verified) but do NOT invent a star rating beyond "5.0★" if it's already supported.
- **About**: "Upstate Tree Solutions is a family-owned and operated tree service based in Anderson, SC. Owner Devin Woessner and his crew handle tree removal, trimming, stump grinding, and storm cleanup across Anderson, Williamston, Belton, Powdersville, Piedmont, and Honea Path — always safe, always on time." (No fabricated founding year.)
- **Logo**: logo.png already in-dir (replace Lumberjack logo references).

## HARD RULES (apply ALL)
0a. Client brand = dark green #006020 + black (you were given the OKLCH green). No red, no Local Launch teal/slate.
2. REAL HD backgrounds (the video hero + services-bg.jpg already provide this). No plain-color cards.
3. Keep the premium frosted-glass card pattern (blur + shadow + rounded) — do NOT flatten it.
5. Every image distinct — 4 work images are already distinct tree scenes; keep hero video + services-bg + 4 work images all different.
6. NO fabricated data — real phone/owner/services/review. No "Est. 2014"/"12 years", no invented founding year, no invented review count (430 is verified).
8. FIRST-ITERATION CORRECTNESS: (a) recolor EVERY red/warm/blue oklch hue (see above); (b) no CSS syntax errors; (c) gallery captions match the actual tree images; (d) never reuse the hero poster as a gallery image.
9. Review count 430 IS verified (Camoufox second-pass) — may show "430 Google reviews · 5.0★". Do not invent additional quotes or a fake aggregate beyond what's given.
10. Scrims/overlays stay DARK (near-black) — the GREEN is for ACCENTS ONLY (buttons, icons, eyebrow, focus, marquee dots). Do NOT tint any scrim green.

## SELF-CERTIFY (end report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO (tree is not a transform trade), HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES (green #006020 + black), okLCH-hue-recolored=YES (27→152), scrims-dark=YES, no-fabricated-year=YES, checked-1280&390=NO (Supervisor verifies)."

Report concisely: what changed, the final `:root` accent values, and confirm no red-hue oklch (hue 27) or Lumberjack strings remain (grep "Lumberjack", "McCollum", "642-7705", "2014", "hue 27").
