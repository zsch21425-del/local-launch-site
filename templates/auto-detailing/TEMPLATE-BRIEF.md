# TEMPLATE-BRIEF — Auto Detailing (approved 2026-08-23)

Premium OKLCH auto-detailing demo, forked from the tree-service premium structure and rebranded for
Locomotion Auto Detail (Anderson SC).

## Structure
- Video hero (real on-trade detailing clip) + dark scrim
- Trust marquee (scrolling): reviews · service area · services
- 4 frosted-glass service cards: Exterior / Interior / Ceramic Coating / Paint Correction
- About: review-count proof (e.g. "28 Five-Star Google Reviews")
- Gallery: 4 DISTINCT detailing work images
- Testimonials: HONEST proof card only (NO fabricated quotes — "Rated 5.0 on Google · N reviews")
- Service-area chips + contact (phone/email) + Local Launch footer

## Brand palette (OKLCH — dark charcoal + amber/gold)
- paper: `oklch(20% 0.003 250)` · paper-2: `oklch(29% 0.004 250)` · paper-3: `oklch(34% 0.004 250)`
- accent: `oklch(72% 0.13 80)` · accent-2: `oklch(78% 0.11 80)`
- ink: `oklch(97% 0.002 146)` · muted: `oklch(65% 0.008 146)`

## Rebrand checklist (change ONLY these)
1. Name + nav brand text (`.nav__brand-text`)
2. Phone (`.nav__phone`, hero CTA, contact, footer) — VERIFY the number matches THIS business
3. Email (contact + footer)
4. Service-area chips (city/region)
5. 4 service card titles + descriptions (match the trade)
6. Hero video + poster (client's own or generated, on-trade)
7. Gallery images (4 DISTINCT scenes, no near-duplicates)
8. Review count / proof (verbatim quotes if available, else honest "N reviews" proof)
9. Colors (accent → client's brand if known, else keep neutral)
10. `deploy.py` PROJECT + slug

## Hard rules
- NO fabricated reviews or metrics
- Hero video must be ON-TRADE (detailing, not trees/houses)
- 4 gallery images must be DISTINCT scenes (vision-verify)
- Footer + logo link → `locallaunchupstate.com`
- NO tree/landscaping/house imagery anywhere
