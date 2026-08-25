# Builder Brief — Pest Control TEMPLATE (cleanup + finalize)

You are the BUILDER. Edit `index.html` in `/mnt/d/LocalLaunch/templates/pest-control/`. This template already exists but is CONTAMINATED and needs a cleanup pass before it's a clean reusable template.

## TASK
1. Remove ALL pressure-washing contamination: delete references/use of `pw-street-web.mp4`, `pw-reviews-web.mp4`, and any pressure-washing wording. These are leftover from the PW template — pest control is NOT pressure washing.
2. Remove the competitor logo `palmetto-logo.svg` (Palmetto Exterminating is a real competitor — a template must be generic). Replace with the generic `brand-placeholder.jpg` or a text-based brand.
3. Confirm the 4 service cards use the CORRECT pest images and clean service names:
   - Termite Control → `svc-termite.jpg`
   - Mosquito Treatment → `svc-mosquito.jpg`
   - Rodent Control → `svc-rodent.jpg`
   - Foundation / Pest Prevention → `svc-foundation.jpg`
4. Verify the hero uses `pest-bg-desktop.mp4` / `pest-bg-mobile.mp4` (poster `pest-bg-poster.jpg`), NOT any PW video.
5. Ensure every section has HD imagery (no flat/plain-color cards), premium light-on-dark cards, no SVG, no leftover off-trade text.

## HARD RULES (apply ALL)
- Pest control is NOT a transform trade — no before/after visualizer needed.
- REAL HD trade images on every section. Every service card = HD image + dark scrim + readable white text. NO flat white/color cards.
- Premium light-on-dark depth cards (near-white rgba(255,255,255,0.92), blur, soft shadow, 18-22px radius).
- Every image DISTINCT (services=4 unique, gallery=4 different, about=own photo). No reuse.
- NO SVG, NO fake data, NO people in imagery, NO gibberish/uncanny AI.
- Poster = video's first frame.
- Use graft (`graft grep`/`graft map`) to find conventions; don't re-explore the repo.

## OUTPUT
Report: PW references removed (count), competitor logo removed, 4 service names+images confirmed, hero video correct. End with:
SELF-CERTIFY: "graft-used=YES/NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, no-people=YES, no-competitor-branding=YES, checked-1280&390=YES".
