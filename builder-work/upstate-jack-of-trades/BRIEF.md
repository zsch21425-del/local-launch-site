# Builder Brief — Upstate Jack of Trades LLC (rebrand handyman template)

You are the BUILDER agent. Rebrand `index.html` in THIS directory (a fork of the approved "Upstate Handyman and Landscaping" template — it currently contains Kevin Pang / Simpsonville / 864-918-5096 / green-navy data). Replace ALL of that with the client below. All required images are already in this directory.

## BUSINESS DATA (verified — do NOT invent)
- **Name:** Upstate Jack of Trades LLC (trades as "Jack of Trades")
- **Owner:** Deishaun Oglesby (runs it with his son Malachi, since 2021)
- **Phone:** (864) 777-3019 · tel link `tel:+18647773019`
- **Service area:** Spartanburg, SC — also Boiling Springs, Gaffney, Cowpens, Glendale
- **Proof points:** Thumbtack "Top Pro" · 4.8★ across 96 reviews · 6 years in business · background-checked · 3 employees · Facebook facebook.com/jothandymen

## SERVICES (4 cards — map each to its image file)
1. **Handyman Repairs & Maintenance** — doors, drywall, gutters, cabinets, walls → `svc-home.jpg`
2. **Interior & Exterior Painting** → `painting-interior.jpg`
3. **Installations & Fixtures** — lighting, ceiling fans, TVs, range hoods, backsplashes, appliances → `ceiling-fan.jpg`
4. **Lawn Care & Yard Maintenance** → `lawn-mowing.jpg`

## GALLERY (4 DIFFERENT work photos — none may repeat a service/about image)
Use: `handyman-tools.jpg`, `drywall-repair.jpg`, `work-sod.jpg`, `work-wall2.jpg`. Captions like "Home repairs", "Painting", "Lawn care", "Installation work".

## REVIEWS (real, verbatim from Thumbtack — do NOT change wording)
1. "I can not say enough great things about this company. Deishaun was very responsive and kind with my elderly mother and help to put myself and her at ease as I live out of state. I would highly recommend him and his company for any type of service that you may need!" — Hilary S. (Thumbtack)
2. "Excellent service, very punctual. Assessed what needed to be done. Realized we did not have one item & ran to Loews to buy what was needed to accomplish the task. Pleasant demeanor! Thank you for installing our fixture. I won't hesitate to call again!" — Debbie S. (Thumbtack)
3. "The team did an amazing job on our kitchen backsplash and range hood installation. We couldn't be happier and are set to do more projects with them already!" — Tiffany D. (Thumbtack)
4. "Excellent to work with and very responsive. He did a great job quickly replacing my ceiling fan and I loved his attention to detail. Looking forward to working with him on some other projects in the near future." — Shari H. (Thumbtack)

## ABOUT
- **About image:** `about.jpg` (a photo, NOT a logo)
- **H2:** "Honest Work. Done Right."
- **P1:** "Upstate Jack of Trades is owned by Deishaun Oglesby, who runs it with his son Malachi. Since 2021 they've handled repairs, painting, installations, and lawn care across Spartanburg and the Upstate — with a background-checked team and the kind of care that earns Top Pro status."
- **P2:** "From a dripping faucet to a fresh coat of paint to a kitchen backsplash, Jack of Trades does the job right the first time. Reliable, responsive, and local."

## BRANDING / COLORS (client's REAL brand — Thumbtack logo: green + white)
Replace the template's navy/green with a **green** palette:
- accent (primary): `#3B9F49`
- accent-light: `#7BC47F`
- brand (dark section bg): `#10241A` (deep green)
- brand-dark: `#0B1A12`
- Keep white text on these dark greens. NO lavender/pink/purple. NO Local Launch teal.

## HERO
- **Hero video:** `hero.mp4` + `hero-poster.jpg` (keep full-bleed `object-fit: cover`)
- **Headline:** "Spartanburg's Handyman & Lawn Care"
- **Sub:** "Repairs, painting, installations & lawn care across Spartanburg and the Upstate."
- **Badge:** "Top Pro · 6 Years · Spartanburg, SC"

## CONSTRAINTS (HARD)
- Remove ALL Kevin Pang / Simpsonville / 864-918-5096 / "Upstate Handyman and Landscaping" text. Grep `Kevin`, `Pang`, `Simpsonville`, `918` → ZERO.
- `svc-pw.jpg` was removed (no pressure-washing service) — do NOT reference it.
- No fabricated facts. Reviews above verbatim only.
- Keep mobile responsive.

## DEPLOY
- `PROJECT = "upstate-jack-of-trades-demo"` (already set in deploy.py — do not change).

## HARD RULES (apply ALL — hard-won from Zach rejection rounds, DO NOT omit)
0. WORK FROM THE GRAFT GRAPH — this is an in-dir rebrand, so you may edit index.html directly; graft=0 is expected/fine.
0a. CLIENT BRAND COLORS — recolor to the green palette above. NEVER /hallmark lavender/pink (#E85C9B/#F2A0C6/#6B4FA8/#9B7ED8) or Local Launch teal/slate.
1. VISUALIZER — handyman is NOT a transform trade; no before/after slider required (mark visualizer=N/A).
2. REAL HD BACKGROUND IMAGES on hero/services/about. NO plain solid-color cards/sections. Every service card = HD trade image + dark scrim.
3. PREMIUM DEPTH CARDS — light/frosted cards elevated off a dark section: rgba(255,255,255,0.92), backdrop-blur, soft shadow, rounded 18-22px, dark titles + gradient icon badges. Copy the gold-standard B&M demo pattern (graft grep it).
4. QUALITY — hero video autoplay muted loop playsinline + poster, award-quality, NO clearly-AI imagery, NO "2010-era" plain look.
5. EVERY image distinct — services=4 unique, gallery=4 DIFFERENT unique, about=own. No reuse across sections.
6. NO SVG, NO fake data. Real phone/owner/reviews (above) or honest placeholder. Trade-specific hero.
7. Poster = the video's exact first frame.
QA before done — the 8.5 VISUAL GATE (quality-over-speed), all three in order:
  (a) redundancy: `/home/zach/hermes-agent/venv/bin/python3 /mnt/d/LocalLaunch/tools/check_redundancy.py <this_dir>` (system python false-passes);
  (b) dual-viewport visual check 1280 + 390 (Gemini): no overlap, no hidden-behind-scrim, no cut CTAs, every card = real distinct trade image, no broken/404;
  (c) fresh-context blind critic at 8.5/10 Diaz bar.

SELF-CERTIFY at the end (exact line):
"SELF-CERTIFY: graft-used=YES/NO, visualizer=N/A (handyman), HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES, checked-1280&390=YES."

## OUTPUT
Report: name/phone/city swaps confirmed, leftover Kevin/Pang/Simpsonville/918 count (must be 0), PROJECT name, SELF-CERTIFY line.
