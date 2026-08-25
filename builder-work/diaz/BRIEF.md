# Builder Brief — Diaz Landscaping & Snowplow LLC demo (landscaper template)

You are the BUILDER agent. Build the Diaz Landscaping & Snowplow demo by editing `index.html` in this directory (a copy of the approved Zeroscapes landscaper demo — structure + all fixes are in it; you are REBRANDING for Diaz). All assets are in this directory.

## BUSINESS DATA (VERIFIED — do NOT invent or change)
- **Name:** Diaz Landscaping & Snowplow LLC
- **Service area:** Wyoming, MI — serves West Michigan / Grand Rapids area. Address 3720 Groveland Ave SW, Wyoming MI.
- **Phone:** (616) 335-1331 · tel link `tel:+16163351331`
- **Email:** diazlandscaping5@gmail.com
- **Tagline:** "Upgrade your outdoor space with professional landscaping & hardscape services"
- **Owner:** Family/local business, 10 years experience, "Se habla espanol" (Spanish spoken). Focus on quality, courteous communication.
- **Proof:** HomeAdvisor 4.6/5 (5 reviews) · 10 years experience · free estimates

## SERVICES (4 cards — verified, map to existing service card structure)
1. **Landscaping & Hardscape** — lawn, garden & yard installation
2. **Retaining Walls & Patios** — stone walls, paver patios
3. **Tree Removal** — safe professional tree removal
4. **Snowplow / Snow Removal** — winter snow & ice removal
Card images in this dir: `svc-hardscape.jpg`, `svc-snow.jpg`, and reuse `hero-still.png` / generate-needed. For card 3 (tree removal) use a tree image from the provided set (reuse `steve-cantrell/svc-removal.jpg` is fine OR the `svc-snow`/`hero` — pick best available landscaping images).

## GALLERY (4 work photos)
Use `svc-hardscape.jpg`, `svc-snow.jpg`, `hero-still.png` + one more landscaping image. Captions like "Retaining wall install", "Snow removal", "Landscaping project".

## REVIEWS (real, verified from HomeAdvisor)
1. "Great job. Timely. Quality work. I also liked their suggestions for beautifying the front." — Reginald J. (5.0)
2. "Service was fast and professional, quote was fair and they stuck to the quoted price." — Jacob D. (5.0, tree removal)
3. "They did a great job!" — Evan H. (5.0, yard clean up)
- Sources = HomeAdvisor.

## ABOUT
- **About image:** a landscaping photo (hero-still or svc-hardscape) — NOT the logo
- **About H2:** "Landscaping & Snow Removal for West Michigan"
- **P1:** "Diaz Landscaping & Snowplow LLC serves Wyoming, Grand Rapids, and the West Michigan area with professional landscaping, hardscape, tree removal, and snow removal. With 10 years of experience, we deliver quality work and clear communication on every project."
- **P2:** "From beautiful landscaping and retaining walls to reliable winter snow removal, we upgrade and protect your outdoor space. Se habla espanol. Free estimates."

## BRANDING / COLORS
- **Logo:** `logo.jpg` (real Diaz logo, on HomeAdvisor) — use in nav + CTA. Colors unknown — use a green landscape palette (forest green, matches logo if it's green; if the logo shows other colors, match them).

## HERO
- **Hero video:** `hero.mp4` + `hero-poster.jpg` — wide cinematic landscaped-lawn shot. Keep bright, headline readable.
- **Hero headline:** "Beautiful Landscapes. Reliable Snow Removal."
- **Hero sub:** "Landscaping, hardscape, tree removal & snowplow in West Michigan — free estimates."
- **Hero badge:** "4.6★ · 10 Years Experience"

## PRICING
- No public pricing → `$` placeholders. Never invent.

## DEPLOY
- Set `PROJECT = "diaz-demo"` in `deploy.py`.

## CONSTRAINTS (HARD)
- Fill ALL placeholders. Grep `{{[A-Z_0-9]*}}` → ZERO.
- No leftover Zeroscapes text: grep "Zeroscapes", "Wellford", "Low Maintenance", "Brent" → gone.
- No fabricated facts. Reviews only verified HomeAdvisor ones.
- Logo in nav + CTA. About uses photo. Keep mobile responsive.

## OUTPUT
Report: placeholders filled count, empty placeholders, leftover Zeroscapes text, PROJECT set.
