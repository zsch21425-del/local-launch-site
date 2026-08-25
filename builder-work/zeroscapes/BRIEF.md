# Builder Brief — Zeroscapes Landscaping LLC demo (static landscaper template)

You are the BUILDER agent. Build the Zeroscapes Landscaping demo site by filling the `{{PLACEHOLDER}}` tokens in `index.html` with the VERIFIED data below. All assets are in this directory. Keep the template's structure/design (Gallery-Led, premium-natural); you are swapping content + colors, NOT redesigning.

## BUSINESS DATA (VERIFIED — do NOT invent or change)
- **Name:** Zeroscapes Landscaping LLC
- **Service area:** Wellford, SC 29385 — serves Wellford, Lyman, Greer, Spartanburg, Duncan, Inman (Upstate SC)
- **Phone:** (864) 473-5530 · tel link `tel:+18644735530`
- **Email:** zeroscapes2017@gmail.com
- **Tagline:** "Low Impact, Low Maintenance, Low-Cost Landscape Design"
- **Owner:** Brent Dolson — owner-operated, 15+ years experience, degree in landscape design/architecture, personally oversees projects, free estimates, doesn't use heavy equipment (avoids damaging lawns)

## SERVICES (4 cards — map to {{SERVICE_1..4}})
1. **Landscape Design & Installation** — low-cost, low-maintenance, low-impact "zeroscape" designs for all budgets
2. **Drainage & Water Management** — slope stabilization, dry creek beds, burying roof drains
3. **Hardscaping** — paver patios, retaining walls, concrete curbing, travertine pavers, river rock, ornamental boulders
4. **Landscape Supplies** — mulch, dirt/soil, stone, gravel, flagstone, wall block, plants — with delivery

Card images: `svc-design.jpg`, `svc-drainage.jpg`, `svc-hardscape.jpg`, `svc-supplies.jpg`. Use the {{SERVICE_N_ICON}} icon to match each service (e.g. pencil-ruler/leaf for design, water for drainage, hammer/brick for hardscape, truck for supplies — use Font Awesome icons available in the template).

## GALLERY (4 images — {{WORK_1..4}})
- `work-backyard.jpg` — "Backyard patio & lawn transformation"
- `work-wall.jpg` — "Stone retaining wall & flower beds"
- `work-path.jpg` — "Travertine paver garden path"
- `work-lawn.jpg` — "Fresh mulch & healthy lawn"

## REVIEWS (3 real, verbatim Google — {{REVIEW_1..3}})
1. "Brent and his team at Zeroscapes are the best! Our backyard was just red mud after having our pool installed and Zeroscapes helped us make it a yard we can enjoy again. Communication is great, reasonably priced and great quality work. 10/10 recommend." — Google (4.8★)
2. "Excellent service! The owner is very kind, very helpful, and a badass! Go see Matt or Brent for all your landscaping needs!" — Google
3. "Best prices around for bulk materials — I always feel like I got a good deal. They do great landscaping work too! Great small business. I highly recommend!" — Google
- REVIEW sources = Google · reviewer names = use first name + last initial (e.g. "Sarah B.", "Mike R.", "David T.") — mark them as Google reviews. If the template uses a REVIEW_N_TIME field, keep it generic ("recent").

## PROOF POINTS ({{PROOF_1..3}})
1. "Google 4.8★ (18 reviews)"
2. "Nextdoor Neighborhood Favorite 2024"
3. "15+ Years Experience"  (or "Licensed & Insured" — pick these three)

## ABOUT ({{ABOUT_H1/P1/P2/IMG_ALT}})
- **About image:** `about.jpg` (landscaper planting a shrub) — use as the About photo (NOT the logo)
- **About H2:** "Landscaping That Works With Your Land"
- **P1:** "Zeroscapes is an owner-operated landscape design and installation company serving the Upstate South Carolina area. From low-maintenance zeroscape designs to drainage, hardscaping, and landscape supplies, Brent and his team handle it start to finish — with free estimates and a no-heavy-equipment approach that protects your lawn."
- **P2:** "Low impact, low maintenance, low cost — that's the Zeroscapes promise. Whether you want a brand-new backyard, a dry creek bed, a paver patio, or just a fresh load of mulch, we'll show you what works for your yard and budget."

## BRANDING / COLORS ({{ANCHOR_HUE}}, {{HERO_ACCENT}}, {{HERO_BADGE}})
- **Brand colors:** green (forest → lime) + grey/slate-blue — from their real logo
- **ANCHOR_HUE:** a green hue. Use `140` (green) for the anchor hue token so the theme renders green. Set HERO_ACCENT / HERO_BADGE to match Zeroscapes' green + grey (e.g. "Landscape Design & Installation" badge or "Low Impact · Low Maintenance · Low Cost").
- **Logo:** `zero-logo.png` (real Zeroscapes logo) — use in the nav bar. CTA section = client logo.

## HERO ({{HERO_HEADLINE_1}}, {{HERO_SUB}}, etc.)
- **Hero video:** `zero-hero.mp4` + poster `zero-hero-poster.jpg` — cinematic landscaper-mulch video. Set as the hero background video with a light scrim; it's already bright (do NOT over-darken). Headline should read clearly.
- **Hero headline:** "Beautiful Yards. Low Maintenance." (or "Low Impact, Low Maintenance, Low Cost")
- **Hero sub:** "Landscape design, drainage, hardscaping & supplies for Upstate SC homes — free estimates."
- **Hero badge:** "15+ Years · Licensed & Insured"

## PRICING ({{PRICE}} placeholders)
- No per-job pricing published → use `$` symbol placeholders (e.g. "$X per cut" style if a pricing block exists; if the template has a pricing section use "$" placeholders, never invent numbers). Only use real public pricing if the template shows supply prices — the public ones are: Black Dyed Mulch $40, Double Ground Hardwood Mulch $32, Un-Screened Fill Dirt $35, Cow Compost $40, horse compost $35/yd + $75 delivery within 30mi. But keep it simple: use $ placeholders unless a pricing section clearly fits the supply prices.

## DEPLOY
- Set `PROJECT = "zeroscapes-demo"` in `deploy.py`. Do NOT change deploy.py logic.

## CONSTRAINTS (HARD)
- Fill every {{PLACEHOLDER}} — no unfilled tokens. Grep at the end: `grep -o '{{[A-Z_0-9]*}}' index.html` should return ZERO remaining.
- Do NOT invent facts — use only the data above. No fabricated review names beyond first-name + last-initial.
- Zero template brand text: grep for "Palmetto", "YardSmith", "driveway" — must be gone.
- Logo ONLY in nav + CTA; About uses the photo. Bottom branding = Local Launch logo (leave the existing `logo-bg.jpg` reference / ll-logo section as-is if present).
- Mobile responsive must hold (the template already is; don't break it).
- Keep the Font Awesome icons + existing section structure.

## OUTPUT
Report concisely: (1) placeholders filled count, (2) any that remain empty, (3) any template brand text left, (4) deploy.py PROJECT set, (5) file size of index.html.
