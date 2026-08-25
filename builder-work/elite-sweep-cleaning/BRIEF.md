# Builder Task — Elite Sweep Property Cleaning (fork `pressure-washing` template — has the AI visualizer)

You are in `/mnt/d/LocalLaunch/builder-work/elite-sweep-cleaning/`. The `pressure-washing` template is copied here (index.html + api/clean-driveway.py + vercel.json + requirements.txt + pw-*.mp4/posters + svc-*.jpg + driveway-before/after-real.jpg + logo.png). Rebrand **B&M Pressure Washing** → **Elite Sweep Property Cleaning** (Kettering, OH). This is a TOKENIZED template — fill the `{{PLACEHOLDERS}}` + recolor + swap the logo. Do NOT restructure; do NOT touch api/clean-driveway.py, vercel.json, or requirements.txt (the AI visualizer must keep working). Graft=0 expected.

## REAL FACTS (verified — use exactly; do NOT invent)
- Business name: **Elite Sweep Property Cleaning**
- City: **Kettering** · State: **OH** · Region: **the Dayton metro** (serve "Kettering & the Dayton metro")
- Phone: **(937) 776-4600** · tel: tel:+19377764600
- Owner: unknown → frame as **women-owned** (GBP-verified attribute). Do NOT invent a name.
- Reviews: 5.0★ / 8 Google reviews. 2 verbatim quotes below. Do NOT inflate the count.
- Slug (deploy.py is NOT used here — the Vercel CLI handles it; just set the `VISUALIZER_SAMPLE` URL's slug in api/clean-driveway.py to `elite-sweep-cleaning-demo` if it's still `{{SLUG}}`): **elite-sweep-cleaning-demo**

## PLACEHOLDER FILL (find-replace)
- `{{BUSINESS_NAME}}` → `Elite Sweep Property Cleaning`
- `{{CITY}}` → `Kettering`
- `{{STATE_ABBR}}` → `OH`
- `{{REGION}}` → `the Dayton metro`
- `{{PHONE}}` → `(937) 776-4600`
- `{{PHONE_LINK}}` → `+19377764600`
- `{{ABOUT_OWNER}}` → `a women-owned property cleaning company serving Kettering and the Dayton metro`
- `{{REVIEW_NAME}}` → `connie thom`
- `{{REVIEW_SOURCE}}` → `Google review`
- The hero H1 is hardcoded "Clean Driveways. / Fresh & Curb-Ready." — keep it (pressure washing is on-trade) or adjust to "Sparkling Clean. / Fresh & Curb-Ready."
- The services section — Elite Sweep's services are: Pressure Washing (porches, decks, patios), Driveway & Walkway Cleaning, Commercial/Grounds Cleaning, Parking Lot Cleaning. Update the 4 service cards + their text to match (the svc-*.jpg images are already pressure-washing scenes — keep them mapped).
- The AI visualizer is "Clean My Driveway" — this is EXACTLY on-trade for Elite Sweep (driveway/walkway cleaning). Keep it as-is. If there's a copy line describing it, keep the driveway framing.
- **Logo**: replace the `bm-brand.jpg` reference (the hero/brand logo) with **logo.png**. alt "Elite Sweep Property Cleaning logo".
- Reviews section: use these 2 verbatim quotes:
  1. "I cannot recommend Elite Sweep enough. They cleaned our walkways, driveway, porch and deck. What a difference. Everything looks so clean and new. Shawn did an amazing job. Please don't hesitate to use this business they are totally professional and reliable." — **connie thom**, Google
  2. "Had my first project with Elite Sweep Property Cleaning done this morning. Very impressed! Quick turn around on the quote, great communication, punctual arrival and fantastic results!" — **Laura Showalter**, Google

## BRAND COLORS — teal/cyan (no brand found; clean-water palette)
Recolor `:root`:
- `--primary: #123A5E` → `#0E3A4A` (deep teal)
- `--primary-dark: #0B1B2B` → `#071B22`
- `--accent: #38BDF8` → `#22B8CF` (cyan)
- `--accent-light: #7DD3FC` → `#67E8F9`
- `--accent-soft: rgba(56,189,248,0.15)` → `rgba(34,184,207,0.15)`
- Also grep for hardcoded navy/sky-blue rgba() (rgb 18,58,94 = #123A5E; rgb 56,189,248 = #38BDF8) in backgrounds/overlays/scrims and replace with the teal/cyan equivalents (same opacities). Changing only `:root` is NOT enough.

## HARD RULES (apply ALL)
0a. Teal/cyan (given). No navy/sky-blue left, no Local Launch teal/slate.
1. VISUALIZER — the AI "clean driveway" slider is REQUIRED and must remain functional (it's the template's selling point). Do NOT remove api/ or the slider.
2. Real HD video backgrounds (pw-street-web.mp4 hero + pw-reviews-web.mp4) — keep them.
3. Keep the glassmorphism cards.
5. Distinct images — service images are already distinct pressure-washing scenes.
6. No fabricated data — no invented owner name (women-owned is the verified attribute), no inflated review count (8 verified).
8. FIRST-ITERATION CORRECTNESS: recolor every navy/sky-blue hex AND rgba; no CSS/JS syntax errors; the visualizer slider still wired to `/api/clean-driveway`.
9. Review count 8/5.0★ verified — show it; no fabricated quotes beyond the 2 given.
10. Scrims stay DARK — cyan is for ACCENTS ONLY.

## SELF-CERTIFY (end report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=YES (AI clean-driveway slider intact), HD-bg=YES, premium-cards=YES, distinct-images=YES, client-brand=YES (teal/cyan), navy-recolored=YES, no-fabricated-data=YES, no-fabricated-owner=YES, checked-1280&390=NO (Supervisor verifies)."

Report concisely: what changed, final `:root` tokens, confirm 0 `{{PLACEHOLDER}}` remain, the visualizer is intact, and no "B&M" / navy #123A5E remain.
