# BRIEF — Odinson Electric (2nd demo, NEW premium style)

You are the BUILDER (Claude Code) for Local Launch. Fork the **premium OKLCH plumbing template** (already copied into this directory) into a **second design option for Odinson Electric** — a licensed residential/commercial electrician. This is the NEW premium style (Big Shoulders Display + IBM Plex Sans + OKLCH colors + trust marquee + sticky HD background + frosted-glass cards), a different design direction from their existing dark-Viking demo.

Work ONLY in this directory: `/mnt/d/LocalLaunch/builder-work/odinson-electric-v2/`. Do NOT touch any other directory.

## REAL FACTS (VERIFIED — use EXACTLY these, do not invent)
- Business: **Odinson Electric LLC** (display as "Odinson Electric")
- Owner: **TJ Maddock** (Master Electrician) + co-owner/wife **Blake Maddock** — family-owned
- City / service area: **Simpsonville, SC + the Upstate SC**
- Address: 12100 Pointe Grand Pl, Ste 12204, Simpsonville, SC 29680
- Phone: **(864) 705-8494** · `tel:+18647058494` (E.164 = +1 + 10 digits, NO double country code)
- Reviews: **5.0★ on Google, 110 reviews** (verified) · **BBB A- accredited** (verified) · **3-year workmanship guarantee**
- About story: family-owned, licensed electrical company in Simpsonville SC, founded by Master Electrician TJ Maddock and his wife Blake, ~10 years / nearly a decade of experience; every project engineered, permitted, and inspected to the National Electrical Code.
- Services (VERIFIED only — set the 4 service cards to these, verbatim):
  1. Panel Upgrades
  2. EV Charger Installation
  3. Rewiring & New Wiring
  4. TV Mounting
  (Also verified specialties: 12V–240V residential + commercial work — fold into the about/service-area copy if helpful.)
- Hero headline / tagline: **"Real Power. Handled Safely."**
- Discounts (10% hero discount strip — this is a verified Local Launch selling point): Military, Law Enforcement, Fire & EMS, Healthcare, Teachers, Seniors 60+
- Client email (for the contact/CTA only): office@oellcsc.com
- Local Launch footer credit (stays constant, do NOT change): locallaunchupstate@gmail.com · (503) 358-5860 · locallaunchupstate.com

## STRUCTURE (copy the plumbing premium template EXACTLY — do not redesign)
Keep every section and layout: full-bleed video hero → scrolling trust-marquee → "What We Do" 4 frosted-glass service cards over a sticky HD background → About → "Our Work" gallery (4) → "What Customers Say" testimonials → service-area → contact/CTA → Local Launch footer. Fonts = Big Shoulders Display + IBM Plex Sans. Colors = OKLCH `--color-*` vars in `:root`.

## WHAT TO CHANGE (rebrand only)
1. Replace ALL "Cooper's Plumbing" / "Cooper" strings → "Odinson Electric" / "Odinson". Remove the old plumbing trade copy.
2. Phone `(803) 648-0203` → `(864) 705-8494` (display AND `tel:` link) everywhere.
3. Email `coopersplumbinginc@gmail.com` → `office@oellcsc.com` (contact/CTA only; footer stays Local Launch).
4. Tagline "Plumbing Done Right Since 1985" → "Real Power. Handled Safely."
5. Trust marquee → VERIFIED points only: "5.0★ · 110 Google Reviews", "BBB A- Accredited", "3-Year Workmanship Guarantee", "Master Electrician Owned", "Family-Owned in Simpsonville". (No unverified "24/7" or "same-day".)
6. 4 service cards → the 4 services above (text + swap the plumbing SVG icons for electric ones: panel/circuit, EV plug, wire/conduit, TV/mount — remove the old wrench/droplet/flame/pipe symbols).
7. About → Odinson story (owner TJ + Blake Maddock, family-owned, ~a decade, NEC code). Stat: swap "40 Years" → "Nearly a Decade of Family Service".
8. Testimonials → 2 verbatim-style quotes aligned to the verified 5.0★/110-review reputation (keep generic enough to be honest — no invented customer names). Keep the 5.0★ / 110 reviews / BBB A- proof points.
9. Service area "Aiken & the CSRA" → "Simpsonville & the Upstate SC".
10. Meta/og title + description + JSON-LD schema → Odinson Electric, Simpsonville SC electrician.

## MEDIA (ALREADY STAGED in this dir — use these, do not regenerate)
- `hero.mp4` (real electrician wiring/panel work, 1280×720) + `hero-poster.jpg` (its exact first frame) — the hero video. The template also references `hero.webm` — generate a webm copy from hero.mp4 via ffmpeg if the template needs it, else point both sources at the files present.
- `services-bg.jpg` — textured copper-wiring/conduit background for the frosted-glass cards.
- `work-a.jpg` (panel upgrade) · `work-b.jpg` (EV charger) · `work-c.jpg` (conduit/junction boxes) · `work-d.jpg` (recessed LED lighting) — the 4 distinct gallery images.
- `logo-bg.jpg` — Local Launch footer logo (keep).

## HARD RULES (apply ALL — hard-won from many Zach rejection rounds; do NOT omit any)
0. WORK FROM THE GRAFT GRAPH — /mnt/d/LocalLaunch has Graft wired into Claude Code. Use `graft grep "<term>"`, `graft map`, `graft ask "<symbol>"` to locate the template + deploy conventions instead of re-reading the repo. Phrase queries as symbol/filename (not prose).
1. VISUALIZER — electrician is NOT a transform trade (no concrete/pressure/paint/junk), so NO before/after visualizer is required. Do not add one.
2. REAL HD BACKGROUND IMAGES on every major section. No plain solid-color cards/sections. Every frosted card sits over the HD `services-bg.jpg`.
3. PREMIUM DEPTH CARDS — frosted/light cards elevated off the dark section (near-white rgba(255,255,255,0.92), backdrop blur, soft shadow, rounded 18-22px, dark titles + colorful gradient icon chips). Copy the template exactly.
4. QUALITY — real video hero (autoplay muted loop playsinline + poster), award-quality, NO AI-slop imagery, no "2010-era" plain look.
5. EVERY image distinct — gallery uses 4 DIFFERENT photos; about/hero/services do not reuse the same image.
6. NO fake/placeholder data — real phone/owner/reviews, trade-specific hero video.
7. Poster = the video's exact first frame (already staged).
8. FIRST-ITERATION CORRECTNESS: (a) recolor EVERY hardcoded rgba() (nav bg, hero overlay, services scrim) to the client's dark brand — changing only :root vars is not enough; (b) the services-section gradient must fill the FULL section (no white/near-black fallback); (c) every gallery image ⇔ caption must match and be ON-TRADE — never rename a caption without swapping its image; (d) no CSS syntax errors; (e) never reuse the hero poster as a gallery image.
9. Review count is VERIFIED (110 reviews, 5.0★, BBB A-) — you MAY cite it.
10. DARK SCRIMS — Odinson's brand is electric green/cyan, but scrims/overlays must be a DARK neutral/charcoal, NOT the bright brand color. The volt-green/cyan is for ACCENTS ONLY (buttons, icon chips, links, glows).
11. READABLE CONTRAST + NO CLIPPED CARDS — dark-on-light OR light-on-dark; never light-grey on white; every service card renders its full icon+title+description at 1280 AND 390.

## BRAND COLORS (Odinson Viking-electric — use these as the accent, OKLCH dark base)
- Page base: near-black green-charcoal (dark), like `oklch(16% 0.01 160)`.
- Primary accent: electric volt green (hex #4ADE80 → approximate `oklch(82% 0.19 152)`).
- Secondary accent: electric cyan (hex #22D3EE → approximate `oklch(80% 0.13 210)`).
- Keep the template's dark `--color-paper` charcoal structure; swap `--color-orange` (red) → volt green, `--color-teal` → cyan. Scrims stay dark charcoal/black.

QA before done (mandatory 8.5 VISUAL GATE): (a) redundancy guardrail `python3 /mnt/d/LocalLaunch/tools/check_redundancy.py /mnt/d/LocalLaunch/builder-work/odinson-electric-v2` via `/home/zach/hermes-agent/venv/bin/python3` (system python false-passes); (b) dual-viewport visual check 1280 + 390; (c) 2-round fresh-context blind critic at the 8.5 bar.

## OUTPUT
Report concisely: what you changed, confirm 0 leftover "Cooper/plumbing" strings, confirm services + icons are electric, confirm phone/name/city correct, and end with the SELF-CERTIFY stamp:
`graft-used=YES/NO, visualizer=NO(not-transform-trade), HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES, rgba-recolored=YES, services-bg-full=YES, scrims-dark=YES, checked-1280&390=YES, image-audit=OK, contrast=OK, cards-not-clipped=OK`
Keep the stamp in your terminal report ONLY — do NOT write it as HTML/CSS comments in index.html.
