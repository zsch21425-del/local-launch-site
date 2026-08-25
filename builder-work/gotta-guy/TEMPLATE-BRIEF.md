# Builder Brief — Upstate Handyman and Landscaping demo (landscaper template)

You are the BUILDER agent. Build the Upstate Handyman and Landscaping demo by editing `index.html` in this directory (a copy of the approved Zeroscapes landscaper demo — structure + fixes are in it; REBRAND for Upstate Handyman and Landscaping). All assets are in this directory.

## BUSINESS DATA (VERIFIED from Nextdoor — do NOT invent)
- **Name:** Upstate Handyman and Landscaping
- **Service area:** Simpsonville, SC (owner at 100 Webbington Pl, Simpsonville, SC 29681) — serves the Upstate SC / Greenville area
- **Phone:** (864) 918-5096 · tel link `tel:+18649185096`
- **Owner:** Kevin Pang — born in the Upstate, 20+ years doing landscaping and home renovations, family-run, quality work, does the customer right
- **Proof:** 20+ years experience · "Neighborhood Favorite" on Nextdoor in Gilder Creek Farm, Simpsonville · customer P. P.: "one who takes pride in his work. Excellent references."

## SERVICES (4 cards — verified from Nextdoor)
1. **Handyman / Home Repair & Maintenance** — interior & exterior fixes, repairs
2. **Landscaping** — planting, pruning, lawn care
3. **Pressure Washing** — driveways, walkways, siding
4. **Home Renovations & Remodeling** — renovations and remodeling projects
Card images in this dir: `svc-home.jpg`, `svc-pw.jpg`, and reuse `hero-still.png` / `hero-poster.jpg` for the other two.

## GALLERY (4 work photos)
Use `svc-home.jpg`, `svc-pw.jpg`, `hero-still.png`, `hero-poster.jpg` — captions like "Home maintenance", "Pressure washing", "Landscaping", "Renovation".

## REVIEWS (real, verified from Nextdoor — NOTE the caveat)
1. "Kevin, my Handyman. One who takes pride in his work. Excellent references." — P. P. (Nextdoor, Nov 2024)
2. (Owner's mother's recommendation — label carefully OR use as a proof point instead of a customer review) "My son, Kevin Pang, is a good handyman. You can call him at 864-918-5096." — G. P. (Nextdoor, Jan 2025)
Use #1 as a review. For #2, either include labeled as "family recommendation" or leave it out / use a proof point. Do NOT present #2 as an independent customer review.
- Proof points: 20+ Years Experience · Nextdoor Neighborhood Favorite (Simpsonville)

## ABOUT
- **About image:** a handyman/landscaping photo (svc-home or hero) — NOT a logo. (No real logo found; use photo.)
- **About H2:** "Honest Work. Done Right."
- **P1:** "Upstate Handyman and Landscaping is owned by Kevin Pang, a Simpsonville native with 20+ years of experience in landscaping and home renovations. From small repairs to full projects, Kevin does quality work, safely, and treats every customer right."
- **P2:** "Born here in the Upstate and raised on hard work — that's the Upstate Handyman promise. Landscaping, pressure washing, handyman repairs, and renovations, all done with pride."

## BRANDING / COLORS
- No official logo/brand → use a clean text-based brand (styled HTML div) or generated PNG with a handyman/home theme (blue/green). Never SVG. Colors: a trustworthy green or navy palette.

## HERO
- **Hero video:** `hero.mp4` + `hero-poster.jpg` — wide cinematic tidy-home shot. Keep bright, headline readable.
- **Hero headline:** "Handyman & Landscaping. Done Right."
- **Hero sub:** "Repairs, landscaping, pressure washing & renovations across the Upstate — quality work, done safely."
- **Hero badge:** "20+ Years · Simpsonville, SC"

## PRICING
- No public pricing → `$` placeholders. Never invent.

## DEPLOY
- Set `PROJECT = "upstate-handyman-demo"` in `deploy.py`.

## CONSTRAINTS (HARD)
- Fill ALL placeholders. Grep `{{[A-Z_0-9]*}}` → ZERO.
- No leftover Zeroscapes text: grep "Zeroscapes", "Wellford", "Low Maintenance", "Brent" → gone.
- No fabricated facts. The second "review" is a family recommendation — label it honestly, don't pass it off as a customer review.
- Keep mobile responsive.

## OUTPUT
Report: placeholders filled count, empty placeholders, leftover Zeroscapes text, PROJECT set.
