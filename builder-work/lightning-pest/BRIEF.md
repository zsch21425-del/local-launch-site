# Builder Task — Lightning Pest & Termite Control (pest-control rebrand)

You are in `/mnt/d/LocalLaunch/builder-work/lightning-pest/`. This is a fork of the pest-control premium
template (video hero + trust marquee + frosted-glass service cards + gallery + contact + footer). Rebrand it
into **Lightning Pest & Termite Control**, a pest control company in Elgin, TX.

## REAL FACTS (verified)
- Business: Lightning Pest & Termite Control
- City: Elgin, TX (serve "Elgin & the Austin area")
- Phone: (512) 281-9686 · tel:+15122819686
- Email: lightningpest@yahoo.com
- Reviews: 4 Google reviews (confirmed GBP). Do NOT invent any other count, star rating, or quote.

## TASK
1. **Replace ALL placeholders** (find-and-replace, get every one):
   - `[COMPANY]` → `Lightning Pest & Termite Control`
   - `[CITY]` → `Elgin`
   - `[STATE]` → `TX`
   - `[PHONE]` → `(512) 281-9686` (display text) AND `tel:+15122819686` (every tel: link)
   - `[EMAIL]` → `lightningpest@yahoo.com`
2. **FIX THE CONTACT FORM** — the current form does `fetch('/api/clean-driveway', …)`, a broken pressure-washing
   leftover (there is no serverless backend in this deploy). REPLACE the entire form with a simple contact section:
   a mailto: link to `lightningpest@yahoo.com`, a tel: link, and "Call or email to schedule your pest inspection."
   NO `<form>`, NO `fetch`, NO `/api/` references anywhere.
3. **Services (4 cards)** — keep: Termite Control, Mosquito Treatment, Rodent Control, Foundation / Pest Prevention.
   Verify each card uses its correct image (svc-termite.jpg, svc-mosquito.jpg, svc-rodent.jpg, svc-foundation.jpg).
4. **Reviews/testimonials** — honest only: "4 Google reviews" + "Trusted pest control across Elgin & the Austin area."
   NO fabricated star counts, review counts, or customer quotes.
5. **Trust marquee** — verified items only: "4 Google Reviews" · "Serving Elgin & the Austin Area" · "Termite · Mosquito · Rodent".

## MEDIA (already staged — keep, do NOT regenerate)
- pest-bg-desktop.mp4 / pest-bg-mobile.mp4 / pest-bg-poster.jpg (hero video + poster)
- pest-hero.jpg, svc-termite.jpg, svc-mosquito.jpg, svc-rodent.jpg, svc-foundation.jpg
- logo-bg.jpg, brand-placeholder.jpg

## REMOVE — grep to ZERO before finishing
`clean-driveway`, `[COMPANY]`, `[CITY]`, `[STATE]`, `[PHONE]`, `[EMAIL]`, `fetch(`, `<form`, any pressure-washing wording

## HARD RULES + SELF-CERTIFY
- NO fabricated reviews / metrics / quotes (HARD FAIL)
- Premium structure intact: video hero, frosted-glass cards, HD imagery, dark palette — no flat/plain cards
- NO people in imagery, no fake data, no SVG
- Poster = video's first frame
- **Report the SELF-CERTIFY stamp in your TERMINAL output ONLY — do NOT write notes into index.html**
- End with: SELF-CERTIFY: name/phone/city correct, 0 placeholders, 0 PW refs, no fabricated reviews, form replaced with mailto/tel, premium structure intact.
