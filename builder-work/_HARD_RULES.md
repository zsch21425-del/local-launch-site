# HARD RULES + SELF-CERTIFY (append to EVERY builder brief)

## Non-negotiable structure (canonical — match the approved lawncare/handyman demos)
1. **WORK FROM THE GRAFT GRAPH** (`graft ask` / `graft map` / graft MCP) to find template + deploy conventions; do not re-explore the repo from scratch.
2. **Video hero (fixed)** spanning hero + services (2 sections): `<video class="hero-bg">` with `position: fixed; inset: 0; width: 100vw; height: 100vh; object-fit: cover; filter: brightness(0.86) saturate(1.08); z-index: 0`. Apply the **uniform dark neutral tint on the `<video>` element itself** via that `brightness()` filter — do NOT add a gradient overlay (a separate overlay creates a visible dark-line seam).
3. **`.hero-overlay { background: none; }`** — no blue/gradient scrim over the hero.
4. **ONE continuous HD image** from gallery → reviews → about → CTA → footer via `<div class="image-wrap">` + `.img-bg` (an `<img>`) + `.img-scrim` (rgba(24,32,42,0.84)). `.services-bg { display: none; }` so the fixed video shows through services.
5. **No white section backgrounds** — dark-glass premium theme throughout. Cards frosted/light-on-dark, never flat plain-color cards.
6. **Real HD photographic backgrounds/images on every section.** Distinct scenes, trade-correct. **NO people, NO text, NO watermarks, NO logos in generated images.**
7. **Poster = first frame** of the hero video (ffmpeg extraction).
8. **Colors = the CLIENT's researched brand** (given in the brief) — never Local Launch teal/slate, never guessed.
9. **Services, reviews, phone, name all VERBATIM from the brief's BUSINESS DATA** — no invented facts. If a review count/rating is unverified, omit the review section entirely.
10. **Dual-viewport QA**: verify clean render at 1280px and 390px — no text overlap, no cut-off cards, no clipping.

## Self-certify stamp (REQUIRED in your final report)
End your report with a checklist confirming:
- [ ] Video hero (fixed, spans hero+services, brightness 0.86, no gradient overlay)
- [ ] One HD image-wrap background gallery→footer
- [ ] No white sections; premium light-on-dark cards
- [ ] All images trade-correct + distinct, no people/text/watermarks
- [ ] Poster = video first frame
- [ ] Client brand colors only
- [ ] Dual-viewport clean at 1280 + 390
- [ ] Zero template-leak text (no old business name / placeholder)
