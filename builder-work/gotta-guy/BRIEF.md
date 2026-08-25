# Builder Brief — Gotta Guy Home Services demo (handyman template)

You are the BUILDER agent. Rebrand the handyman demo by editing `index.html` in this directory (a copy of the approved handyman template — structure + all fixes are in it; REBRAND for **Gotta Guy Home Services**). All assets are in this directory.

## BUSINESS DATA (VERIFIED — do NOT invent anything)
- **Name:** Gotta Guy Home Services (LLC)
- **Owner:** James "Jamie" Marler — Fountain Inn, SC handyman, in business since 2013 (10+ years)
- **Service area:** Simpsonville · Fountain Inn · Mauldin · Five Forks, SC (Greenville County)
- **Phone:** (864) 430-7248 · tel link `tel:+18644307248`
- **Email:** gottaguy5@gmail.com
- **Proof points:** Nextdoor "Neighborhood Favorite" in 6 neighborhoods · 10+ years in business
- ⛔ Do NOT claim "27 reviews / 4.9★" — that figure is UNVERIFIED. ⛔ Do NOT reference gottaguy.com — it is an unrelated New Jersey company.

## BRAND COLORS (VERIFIED from their real logo — use EXACTLY these, do NOT invent others)
- **Primary:** orange/terracotta **#ED4A25** (house-icon + wordmark)
- **White:** #FFFFFF (logo background)
- **Accent / border:** muted teal/sage **#81948E**
- Recolor `:root` AND **every** hardcoded `rgba()` in the whole file. Zero remnant of navy `#1B3C53`/`#0F2438` or green `#4F8A3D`/`#8FC97A`. Never teal/slate/pink/purple. Never guess a palette — orange + white + sage only.

## HERO
- Keep `hero.mp4` + `hero-poster.jpg` (generic handyman b-roll).
- **Badge:** "Neighborhood Favorite · Simpsonville, SC"
- **Headline:** "Your Go-To Handyman. Done Right."
- **Sub:** "Decks, doors, floors, lights, gutters & more — interior and exterior repairs across Simpsonville, Fountain Inn, Mauldin & Five Forks."
- **Proof chips:** "Neighborhood Favorite ×6" · "10+ Years"
- **Phone:** (864) 430-7248

## SERVICES (4 cards — image MUST be on-trade)
1. **Handyman Repairs** — "Interior & exterior fixes — from the gutters down to the crawlspace and most things between." → `handyman-tools.jpg`
2. **Decks, Doors & Floors** — "Deck builds & staining, door replacement, flooring and garage coatings." → `deck-build.jpg`
3. **Lights, Fans & Electrical** — "Minor electrical — lights, fans, switches and fixtures, done safely." → `ceiling-fan.jpg`
4. **Drywall, Paint & Plumbing** — "Drywall repair, interior painting, and sinks, faucets & toilets." → `plumbing-sink.jpg`

## GALLERY (4 photos — caption MUST match the image, all on-trade)
1. "Deck build" → `deck-stained.jpg`
2. "Gutter cleaning" → `gutter-cleaning.jpg`
3. "Flooring install" → `flooring-install.jpg`
4. "Door replacement" → `door-replacement.jpg`

## REVIEWS (use EXACTLY these 3 verbatim Nextdoor quotes)
1. "Jamie and Mike did a great job for me. Rehung a shutter and installed a light fixture. Professional, friendly and reasonable. I'll definitely be calling them back for other handy jobs!" — S. M., Simpsonville (Dec 2024)
2. "He built me a set of stairs for my back door, made an enclosure for my water heater and jacked up my porch that had sunk in a little. He also does drywall and painting I believe. Very fair." — D. M., Simpsonville (Apr 2024)
3. "I was very pleased with his work at a reasonable rate. He came when he said he would and was very polite." — D. M., Simpsonville (Apr 2024)
- **Proof points:** "Neighborhood Favorite ×6 neighborhoods" · "10+ Years"

## ABOUT
- **About image:** a handyman photo (`handyman-tools.jpg` or `deck-build.jpg`) — NOT a logo.
- **H2:** "Honest Work. Done Right."
- **P1:** "Gotta Guy Home Services is owned by James 'Jamie' Marler, a Fountain Inn handyman with 10+ years helping neighbors across the Upstate. From decks and doors to gutters, drywall and plumbing — if it needs fixing, Jamie's the guy."
- **P2:** "Serving Simpsonville, Fountain Inn, Mauldin and Five Forks, Gotta Guy handles interior and exterior repairs — quality work at a reasonable price, and a Neighborhood Favorite in six neighborhoods."
- **Phone CTA:** (864) 430-7248

## DEPLOY
- `deploy.py` already has `PROJECT = "gotta-guy-demo"`. Do not change it.

## HARD RULES (NON-NEGOTIABLE — self-certify)
1. **CLIENT BRAND:** orange #ED4A25 + white + sage #81948E ONLY.
2. Recolor **every** hardcoded `rgba()` — not just `:root`. Grep navy/green remnants → ZERO.
3. Services shade gradient MUST fill the **entire** services section (no 100vh cutoff → white/black fallback). Cream base underneath so the dark gradient reads as shades.
4. Gallery image ⇔ caption MUST match on-trade. No lawn/landscaping/pressure-wash/HVAC image in a handyman demo.
5. NO `;,` CSS syntax errors.
6. NEVER reuse the hero poster as a gallery image.
7. Real HD background images on every section; premium light-on-dark cards; NO plain-color/flat cards.
8. Distinct images — no two visually identical.
9. NO people in any image.
10. Fill ALL placeholders. Grep for leftover "Kevin", "Pang", "Upstate Handyman and Landscaping", "918-5096", "landscaping", "pressure washing", "renovation" → replaced with Gotta Guy copy (ZERO leftovers).

## OUTPUT — SELF-CERTIFY STAMP (report exactly this at the end)
`graft-used=YES, visualizer=NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES, rgba-recolored=YES, services-bg-full=YES, phone=8644307248, no-template-leak=YES`
