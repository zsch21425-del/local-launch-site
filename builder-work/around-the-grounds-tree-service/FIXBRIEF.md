# FIX BRIEF — Around The Grounds Tree Service: service cards need HD PHOTOS, not icons

## Problem (from vision QA — this is a real defect, fix it)
1. The 4 SERVICE CARDS currently use Font Awesome ICONS (fa-tree / fa-scissors / fa-gear / fa-triangle-exclamation). This is WRONG — the BRIEF requires each service card to use its HD trade PHOTO (svc0-3.jpg) with a dark bottom-gradient scrim so white text stays readable. Icon-only cards look cheap (Zach's exact complaint on the painter demo: "cards look cheap").
2. Move the HD photos INTO the service cards. The gallery below can be REMOVED or kept, but the cards must carry the photos.

## The correct pattern (copy the gold-standard B&M pressure-washing demo — find it via graft)
Each `.service-card` = a `<div>` with `position:relative; overflow:hidden; min-height:260px` containing:
- `<img src="svcN.jpg">` absolutely positioned, `inset:0; width:100%; height:100%; object-fit:cover`
- a dark scrim gradient (`linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.05))`) via `::after`
- text content (`h3` + `p`) positioned bottom, white with text-shadow, z-index above the scrim

Mapping (use these exact files, already in this dir):
- Tree Removal → svc0.jpg
- Trimming & Pruning → svc1.jpg
- Stump Grinding → svc2.jpg
- 24/7 Emergency Service → svc3.jpg (chipper/cleanup)

## Constraints
- Do NOT regenerate images. Use svc0-3.jpg as-is.
- Keep the hero video (hero.mp4) + poster as-is.
- Keep the crisp-text rules: body/card text font-weight 400, no backdrop-filter on text cards, --text-muted #555.
- Keep phone 770-5067, no fabricated reviews, no B&M/Fountain Inn/804-8883.

## Output
Edit index.html. When done grep to prove: each svc0-3.jpg is referenced inside a service-card (not just gallery), phone present, no B&M leaks. Then report with the self-certify line:
SELF-CERTIFY: "graft-used=YES/NO, service-cards-HD-photos=YES, 4-distinct-photos=YES, crisp-text=YES, hero-video=YES, checked-1280&390=YES."
