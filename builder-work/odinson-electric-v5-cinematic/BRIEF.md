# BRIEF — Odinson Electric — Demo #5 "Cinematic Scroll" (rebrand)

You are the BUILDER (Claude Code). REBRAND the lawncare template (already copied into this directory as `index.html`) into **Odinson Electric**, a licensed residential/commercial electrician. This is a FIFTH design direction. Work ONLY in `/mnt/d/LocalLaunch/builder-work/odinson-electric-v5-cinematic/`.

## THE STYLE — "Cinematic Scroll" (the lawncare canonical look)
This template's signature: **ONE moving video runs through the hero + services sections (two sections, uniform dark tint), then ONE continuous HD image carries gallery → reviews → about → CTA → footer. Exactly two backgrounds, no white sections.** This is a different feel from the OKLCH-glass and Viking demos.

Keep the template's structure EXACTLY. Rebrand only:
- "fixed" hero video (`position: fixed`, `object-fit: cover`, `filter: brightness(0.86)` — the uniform dark tint, NO colored overlay gradient) → use `od-wiring.mp4` (1280×720, poster `od-wiring-poster.jpg`).
- `.hero-overlay` background → `none` (the brightness(0.86) on the video IS the tint).
- hero text radial = neutral black `rgba(0,0,0,0.28→0.12)`; white text + strong text-shadow.
- `.services-bg` → `display: none` (services stays transparent so the fixed video shows through).
- ONE HD image from gallery → footer (the `<div class="image-wrap">` with a dark `rgba(24,32,42,0.84)` scrim) → use a strong electrician image (`services-bg.jpg` or `real-project.jpg`).
- Swap ALL lawncare/landscaping copy, icons, services, and the previous client's name/phone/city to Odinson.

## REAL FACTS (VERIFIED — use EXACTLY)
- Odinson Electric LLC · TJ Maddock (Master Electrician) + wife Blake, family-owned
- Simpsonville SC + Upstate SC · (864) 705-8494 (`tel:+18647058494`) · office@oellcsc.com
- 5.0★ Google · 110 reviews · BBB A- · 3-year guarantee
- Services (4, verbatim): Panel Upgrades · EV Charger Installation · Rewiring & New Wiring · TV Mounting
- 10% discount: Military, Law Enforcement, Fire & EMS, Healthcare, Teachers, Seniors 60+

## MEDIA (staged in this dir)
`od-wiring.mp4` (fixed hero video) · `od-wiring-poster.jpg` (poster) · `odinson-logo.png` (nav) · `services-bg.jpg` or `real-project.jpg` (the ONE HD image → footer) · `work-a..d.jpg` (gallery) · `svc-*.jpg` (service cards) · `logo-bg.jpg` (Local Launch footer).

## HARD RULES (apply ALL)
1. Exactly TWO backgrounds: (a) the fixed `od-wiring.mp4` video through hero+services, (b) ONE HD image gallery→footer. NO white sections, NO extra colored sections.
2. `filter: brightness(0.86)` on the video = the uniform dark tint — do NOT add a blue/navy overlay gradient (that creates a visible seam). `.hero-overlay { background: none }`.
3. Real HD electrician imagery on every card; every gallery image distinct; no reuse.
4. No fabricated reviews — cite verified 110/5.0★/BBB A-; no invented names.
5. Remove every lawncare/landscaping string + the previous client's name/phone/city/trade. Grep and confirm 0 leftovers.
6. Readable contrast + no clipped cards at 1280 AND 390. Centered content, full-bleed.
7. Local Launch footer constant: locallaunchupstate.com / (503) 358-5860 / locallaunchupstate@gmail.com.

QA before done: (a) `python3 /mnt/d/LocalLaunch/tools/check_redundancy.py /mnt/d/LocalLaunch/builder-work/odinson-electric-v5-cinematic` via `/home/zach/hermes-agent/venv/bin/python3`; (b) dual-viewport 1280 + 390; (c) grep 0 leftover lawncare strings; (d) confirm the hero video plays + is `position: fixed`.

## OUTPUT
Report concisely + end with the SELF-CERTIFY stamp (terminal report ONLY):
`graft-used=YES/NO, fixed-video-hero=YES, two-backgrounds=YES, no-white-sections=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES, no-lawncare-leaks=YES, checked-1280&390=YES, contrast=OK, cards-not-clipped=OK`
