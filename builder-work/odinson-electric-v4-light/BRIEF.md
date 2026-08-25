# BRIEF — Odinson Electric — Demo #4 "Light Editorial"

You are the BUILDER (Claude Code). Build a NEW single-file demo (`index.html`) for **Odinson Electric**, a licensed residential/commercial electrician. This is a FOURTH design direction. Build FRESH — create the HTML from scratch in this directory. Work ONLY in `/mnt/d/LocalLaunch/builder-work/odinson-electric-v4-light/`.

## THE STYLE — "Light Editorial" (the OPPOSITE of our other demos)
Every other Odinson demo is DARK. This one is a clean, light, editorial design — like a premium trade magazine or a modern startup landing page. It should feel airy, trustworthy, and crisp.

1. **Light theme** — off-white/white page background (e.g. `#faf9f7` / `#ffffff`). Dark near-black text (`#111827`). This is the key differentiator.
2. **Bold editorial typography** — a large, characterful display serif or grotesque for headlines ("Fraunces" or "Bricolage Grotesque") + a clean sans for body ("Inter"). Generous whitespace, large line-height, minimal chrome.
3. **Minimal + confident** — no icon tiles, no glass cards, no marquee. Flat, textual, editorial sections. ONE accent color (volt green `#16a34a` or copper `#d97706`) used sparingly for links/buttons/highlights only.
4. **Hero** — a big bold headline ("Real Power. Handled Safely.") + one strong real photo (large, right-side or full-bleed below the headline) + trust line + single primary CTA. NOT a video hero.
5. **Services** — a clean editorial list or a 2×2 grid of minimal cards (photo top, title + one line below), lots of spacing.
6. **Subtle premium details** — thin hairline dividers, small-caps section labels, a slight reveal on scroll (CSS `view-timeline` or a light IntersectionObserver fade-up), no heavy effects.

## STRUCTURE (top to bottom)
1. Minimal top nav (logo + phone CTA, light background, hairline bottom border).
2. **Hero** — headline + subline + real photo (`real-project.jpg` or `real-team-20250301.jpg`) + trust line (5.0★/110 · BBB A- · 3-yr guarantee) + CTA.
3. **Services** — the 4 services as clean minimal cards or an editorial list.
4. **About** — owner story (TJ & Blake Maddock, family-owned, ~a decade) + real photo + 10% hero-discount strip (Military, LEO, Fire/EMS, Healthcare, Teachers, Seniors 60+).
5. **Gallery "Our Work"** — 4 distinct images (`work-a..d.jpg`).
6. **Testimonials** — 2 honest quotes (no invented names).
7. **Service area** — Simpsonville + Upstate SC.
8. **Contact / CTA** + Local Launch footer (`logo-bg.jpg` → locallaunchupstate.com, (503) 358-5860, locallaunchupstate@gmail.com).

## REAL FACTS (VERIFIED — use EXACTLY)
- Odinson Electric LLC · TJ Maddock (Master Electrician) + wife Blake, family-owned
- Simpsonville SC + Upstate SC · (864) 705-8494 (`tel:+18647058494`) · office@oellcsc.com
- 5.0★ Google · 110 reviews · BBB A- · 3-year guarantee
- Services (4, verbatim): Panel Upgrades · EV Charger Installation · Rewiring & New Wiring · TV Mounting

## MEDIA (staged in this dir — use these; do not regenerate)
`odinson-logo.png` (nav) · `real-project.jpg` `real-team-20250301.jpg` (hero/about) · `svc-panel.jpg` `svc-ev.jpg` `svc-wiring.jpg` `svc-generator.jpg` `svc-lighting.jpg` (services) · `work-a.jpg` `work-b.jpg` `work-c.jpg` `work-d.jpg` (gallery) · `logo-bg.jpg`. (You may also use `od-wiring.mp4` as a small about-section accent if it fits, but the HERO must be a static image + headline, NOT a video.)

## HARD RULES (apply ALL)
1. Real HD electrician imagery on every card/section — no plain color cards, no stock-y look.
2. Every image distinct — no reuse across sections.
3. No fabricated reviews — cite verified 110/5.0★/BBB A-; no invented customer names.
4. Text-on-image uses white text + dark scrim (NEVER dark text on a bright photo). On the LIGHT sections, use dark text on the light background.
5. Readable contrast + no clipped cards at 1280 AND 390. Even grids, centered content, full-bleed images (no white gutters on the dark/photo sections).
6. Local Launch footer constant: locallaunchupstate.com / (503) 358-5860 / locallaunchupstate@gmail.com.
7. Keep it LIGHT — do not drift into a dark theme. The whole point is a light, editorial contrast to the other demos.

QA before done: (a) `python3 /mnt/d/LocalLaunch/tools/check_redundancy.py /mnt/d/LocalLaunch/builder-work/odinson-electric-v4-light` via `/home/zach/hermes-agent/venv/bin/python3`; (b) dual-viewport 1280 + 390; (c) every media ref is a staged file.

## OUTPUT
Report concisely + end with the SELF-CERTIFY stamp (terminal report ONLY, never as HTML comments):
`graft-used=YES/NO, light-theme=YES, editorial-type=YES, HD-bg=YES, distinct-images=YES, client-brand=YES, scrims-dark-on-photo=YES, checked-1280&390=YES, contrast=OK, cards-not-clipped=OK`
