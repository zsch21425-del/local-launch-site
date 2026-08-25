# Lawncare / Landscaping Template — CANONICAL (approved by Zach 2026-08-19)

**Source:** L&P Lawncare demo (the build Zach approved as "perfect").
**Use for:** lawn care, landscaping, hardscaping, grounds-maintenance prospects.

## Structure (copy EXACTLY — do not redesign)
1. **Video hero** — full-bleed `<video class="hero-bg">`, `position: fixed`, spans **2 sections** (hero + services).
   - Dark tint applied ON the video (`filter: brightness(0.86) saturate(1.08)`) — UNIFORM, no overlay gradient (a separate gradient overlay creates a visible "dark line" seam).
   - Hero overlay = `background: none`.
2. **Services** — transparent (shows the same video), frosted thumbnail+icon cards.
3. **`<div class="image-wrap">`** — ONE continuous HD image from gallery → reviews → about → CTA → footer (to the very bottom). No solid color blocks, no grass/video near the bottom.
4. **No white section backgrounds** anywhere. Dark glass throughout.

## Rebrand = change ONLY these (never touch structure/CSS layout)
- brand colors in `:root` (--brand, --brand-dark, --accent, etc.)
- business name, phone, service-area wording
- services list (text + icons)
- reviews (VERBATIM only — never fabricate count/rating)
- images (hero video + poster, service thumbs, gallery, about, reviews-bg)
- logo/icon

## Verification (run before showing Zach)
- `check_redundancy.py` guardrail (venv python)
- enumerate all src/poster/url() refs → HTTP 200 against live URL (screenshots miss 404s)
- dual-viewport (1280 + 390) via Camoufox/playwright + Gemini vision
- confirm: NO dark-line seam between hero and services; grass/video tint uniform
