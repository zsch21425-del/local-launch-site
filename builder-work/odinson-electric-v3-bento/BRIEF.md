# BRIEF — Odinson Electric — Demo #3 "Electric Bento"

You are the BUILDER (Claude Code). Build a NEW single-file demo (`index.html`) for **Odinson Electric**, a licensed residential/commercial electrician. This is a THIRD design direction, distinct from their other demos. Build it FRESH — no template to fork, create the HTML from scratch in this directory. Work ONLY in `/mnt/d/LocalLaunch/builder-work/odinson-electric-v3-bento/`.

## THE STYLE — "Electric Bento" (premium interactive, from our July research)
This is the DIFFERENTIATOR vs the other demos. Do NOT use a uniform 2×2/3×3 card grid and do NOT use the dark-green/cyan Viking look.

1. **Bento grid services** — the "What We Do" section uses a CSS Grid bento layout: tiles of VARYING sizes (one large 2×2 "hero" tile + smaller 1×1 tiles). Not a uniform grid. Each tile = one service, with its own HD electrician image + dark scrim + title + short line. `grid-template-columns` with explicit `span` so the layout reads modern/asymmetric (but still even + centered — no orphan 3+1).
2. **Mouse-tracking glow cards** — every service tile + the CTA has a radial-gradient "glow" that follows the cursor (JS `mousemove` sets a `--mx`/`--my` CSS var; the card's `::before` is a radial glow at that point). Subtle, premium, electric.
3. **Electric "sparks" cursor trail** — a lightweight canvas/JS cursor trail of tiny electric-blue sparks that fades behind the pointer. Keep it subtle + `prefers-reduced-motion` friendly (disabled when reduced motion).
4. **Gradient-text headline** — the hero H1 uses a background-clip gradient (electric blue → copper/amber) on the accent words.
5. **Color = copper/amber electric** — DIFFERENT from the other demos' green/cyan. Page bg = deep navy/charcoal (`#0a1628`-family). Primary accent = copper/amber (`#f59e0b` / `#d97706`). Secondary = electric blue (`#38bdf8`). Scrims stay dark neutral (navy/black), accent is for glow/buttons/icons only.
6. **Fonts:** "Space Grotesk" (display) + "Inter" (body) via Google Fonts. Technical, modern, premium.

## STRUCTURE (sections, top to bottom)
1. Sticky glass nav (Odinson Electric · logo · phone CTA "Free Estimate").
2. **Hero** — full-bleed wiring video (`od-wiring.mp4`, autoplay muted loop playsinline, poster `od-wiring-poster.jpg`) + dark scrim + gradient-text headline "Real Power. Handled Safely." + trust line (5.0★/110 · BBB A- · 3-yr guarantee) + 2 CTAs (Call + Services).
3. **Bento "What We Do"** — the bento grid of the 4 services (see below), each tile a distinct electrician image.
4. **About** — owner story (TJ & Blake Maddock, family-owned, ~a decade) + a real photo + the 10% hero-discount proof strip.
5. **Gallery "Our Work"** — 4 distinct images (reuse `work-a..d.jpg`).
6. **Testimonials** — 2 short honest quotes aligned to 5.0★/110 reviews (no invented customer names).
7. **Service area** — Simpsonville + Upstate SC.
8. **Contact / CTA** + Local Launch footer (`logo-bg.jpg` → locallaunchupstate.com, phone (503) 358-5860, locallaunchupstate@gmail.com).

## REAL FACTS (VERIFIED — use EXACTLY)
- Business: Odinson Electric LLC · Owner TJ Maddock (Master Electrician) + wife Blake, family-owned
- Simpsonville SC + Upstate SC · Phone (864) 705-8494 (`tel:+18647058494`) · client email office@oellcsc.com
- Reviews: 5.0★ Google · 110 reviews · BBB A- · 3-year workmanship guarantee
- Services (4, verbatim): Panel Upgrades · EV Charger Installation · Rewiring & New Wiring · TV Mounting
- 10% discount: Military, Law Enforcement, Fire & EMS, Healthcare, Teachers, Seniors 60+

## MEDIA (already staged in this dir — use these; do not regenerate)
`od-wiring.mp4` (hero video 1280×720) · `od-wiring-poster.jpg` · `odinson-logo.png` (nav logo) · service images `svc-panel.jpg` `svc-ev.jpg` `svc-wiring.jpg` `svc-generator.jpg` `svc-lighting.jpg` · `real-project.jpg` `real-team-20250301.jpg` · gallery `work-a.jpg` `work-b.jpg` `work-c.jpg` `work-d.jpg` · `logo-bg.jpg`.

## HARD RULES (apply ALL)
1. Real HD electrician imagery on every card/tile — no plain color cards. Dark scrim so text stays readable.
2. Every tile/gallery image distinct — no reuse across sections.
3. No fabricated reviews/ratings — 110 reviews/5.0★/BBB A- are verified, cite them; do NOT invent customer names.
4. Dark scrims only (navy/black) — copper/amber is accent-only (glow/buttons/icons), never a full-page amber wash.
5. Readable contrast + no clipped cards at 1280 AND 390. Even grids, centered content, full-bleed bg (no white side gutters).
6. Poster = video's exact first frame.
7. `prefers-reduced-motion` disables the sparks trail + glow.
8. Local Launch footer stays constant: locallaunchupstate.com / (503) 358-5860 / locallaunchupstate@gmail.com.

QA before done: (a) `python3 /mnt/d/LocalLaunch/tools/check_redundancy.py /mnt/d/LocalLaunch/builder-work/odinson-electric-v3-bento` via `/home/zach/hermes-agent/venv/bin/python3`; (b) dual-viewport 1280 + 390 check; (c) confirm hero video plays + every media ref is a staged file.

## OUTPUT
Report concisely what you built + end with the SELF-CERTIFY stamp (in your terminal report ONLY, never as HTML comments):
`graft-used=YES/NO, bento=YES, glow-cards=YES, sparks-cursor=YES, gradient-text=YES, HD-bg=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES, scrims-dark=YES, checked-1280&390=YES, contrast=OK, cards-not-clipped=OK`
