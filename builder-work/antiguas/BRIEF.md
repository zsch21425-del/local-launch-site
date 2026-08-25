# Builder Brief — Antigua's Landscaping demo (landscaper template)

You are the BUILDER agent. Build the Antigua's Landscaping demo by editing `index.html` in this directory (a copy of the approved Zeroscapes landscaper demo — the structure + all fixes are already in it; you are REBRANDING it for Antigua's). All assets are in this directory.

## BUSINESS DATA (VERIFIED — do NOT invent or change)
- **Name:** Antigua's Landscaping
- **Service area:** Providence, RI — serves Providence, Cranston & nearby Rhode Island. Address 187 Althea St, Providence, RI 02909.
- **Phone:** (401) 419-9784 · tel link `tel:+14014199784`
- **Email:** antiguaslandscaping@gmail.com
- **Tagline:** "Reliable & Affordable — Free Estimates"
- **Owner:** Nilson Antigua — owned & operated, 4 years as a contractor, responsible/punctual/clean work, free estimates, one-time or regular maintenance.

## SERVICES (4 cards — use the verified services, map to existing service card structure)
1. **Lawn Mowing** — clean, reliable weekly or one-time mowing
2. **Yard Cleanups** — seasonal and spring/fall cleanups, debris removal
3. **Bush Trimming & Mulch** — hedge shaping, planting, fresh mulch beds
4. **Stone Work** — stone edging, walkways, landscape stone
Card images in this dir: `svc-mow.jpg`, `svc-cleanup.jpg`, `svc-trim.jpg`, `svc-mulch.jpg`.

## GALLERY (reuse the wide hero + service images or the provided ones — use real-looking landscaping photos)
Use `svc-mow.jpg`, `svc-cleanup.jpg`, `svc-trim.jpg`, `svc-mulch.jpg` OR `hero-still.png` variants. Keep 4 work slots with captions.

## REVIEWS (real — use the verified ones)
1. "Excellent work, will definitely have them back for my future landscaping services!" — Tammy S. (GreenPal)
2. (Owner statement, label as such or use a proof point instead) — Nilson Antigua: "I am responsible, punctual, and deliver good, clean, and beautiful work." (present as owner's promise, NOT a customer review)
- Proof points: 5.0★ (14 reviews) on LawnStarter · Ranked #3 Landscaper in Providence on GreenPal · Nextdoor 2026 Winner

## ABOUT
- **About image:** use `svc-mow.jpg` or the provided hero-still (landscape landscaping photo — NOT the logo)
- **About H2:** "Landscaping Done Right in Providence"
- **P1:** "Antigua's Landscaping is an owner-operated company serving Providence, Cranston, and the surrounding Rhode Island area. Owned and operated by Nilson Antigua, we deliver clean, reliable landscaping — from mowing and yard cleanups to bush trimming, mulch, and stone work."
- **P2:** "Reliable and affordable with free estimates. Whether you need a one-time cleanup or regular maintenance, we'll show up on time and leave your property looking its best."

## BRANDING / COLORS
- **Colors:** forest green + lime green with white text, cream background, earthy brown accents (from their real logo)
- **ANCHOR_HUE:** green (~140). Set accent/badge to match.
- **Logo:** `logo.png` (real Antigua's logo, circular) — use in nav + CTA.

## HERO
- **Hero video:** `hero.mp4` + poster `hero-poster.jpg` — wide cinematic mowed-lawn shot. Use as hero background video, keep bright, headline readable.
- **Hero headline:** "Clean Lawns. Reliable Service." (or "Reliable & Affordable Landscaping")
- **Hero sub:** "Mowing, yard cleanups, trimming & stone work in Providence, RI — free estimates."
- **Hero badge:** "5.0★ · Free Estimates"

## PRICING
- No public pricing → use `$` placeholders. Never invent numbers.

## DEPLOY
- Set `PROJECT = "antiguas-demo"` in `deploy.py`.

## CONSTRAINTS (HARD)
- Fill ALL placeholders — grep `{{[A-Z_0-9]*}}` must return ZERO.
- No leftover Zeroscapes text: grep "Zeroscapes", "Wellford", "Low Maintenance", "Brent" — all gone.
- No fabricated facts. Reviews only what's verified. The owner-statement is labeled as owner promise, not a customer review.
- Logo in nav + CTA only. About uses a photo.
- Keep mobile responsive (the base already is). Don't break it.

## OUTPUT
Report: placeholders filled count, empty placeholders, leftover Zeroscapes text, PROJECT set.
