# Tree Service Template — CANONICAL (approved by Zach 2026-08-21)

**Source:** Lumberjack Tree Service demo (`lumberjack-tree-demo.vercel.app`) — "Tree service is amazing."
**Use for:** tree removal/trimming, stump grinding, storm response, arborist services.

## ⚠️ Premium OKLCH system (same family as `concrete/` + `cleaning/`, NOT lawncare/handyman)

- **Colors are OKLCH** (not hex) — all in `:root` as `--color-*` vars.
- **Fonts:** "Big Shoulders Display" (display) + "IBM Plex Sans" (body).
- **Signature:** video hero + scrolling `trust-marquee` + **sticky HD image background with frosted-glass service cards**.

## Structure (copy EXACTLY — do not redesign)

1. **Video hero** — full-bleed `<video class="hero__video">` (`hero.webm` + `hero.mp4` + `hero-poster.jpg`), real client video (arborist work), autoplay/muted/loop. Ken Burns zoom stays on the poster fallback img only.
2. **Trust marquee** — scrolling proof strip (12 Years · 24/7 Emergency · Free Estimates · Veteran & Senior Discounts · Residential & Commercial).
3. **Services "What We Do"** — sticky-pinned HD image bg (wood chips) + frosted-glass cards.
4. **About** — owner story + verbatim review + platform stats.
5. **Gallery** — `work-a.jpg` → `work-d.jpg`.
6. **Testimonials → service area → contact → footer.**

## 🔑 Premium services treatment (sticky bg + glass cards)

Same as `cleaning/` — see its `TEMPLATE-BRIEF.md` for the full explanation. Key points:

- `.services-bg` — `position:sticky; top:0; height:100dvh; margin-bottom:-100dvh; z-index:-1;` with the HD image + scrim as its `background`. Pinning to the viewport keeps the image crisp on tall mobile sections.
- `.service-card` — frosted glass: `backdrop-filter:blur(16px)` + `color-mix(... var(--color-paper) 52% ...)` (the **dark-image default**), border + shadow + rounded corners + light text.
- **No mobile portrait swap needed here** — wood chips is a dark, high-texture image that reads at any crop (unlike cleaning's brighter scene). Only add a portrait swap if the trade's image is a bright *scene* that crops poorly.

## Brand colors (OKLCH — swap to client's brand on rebrand)

| Var | Value | Role |
|---|---|---|
| `--color-paper` | `oklch(24% 0.006 1)` | dark page bg |
| `--color-paper-2` / `-3` | `oklch(33%/36% …)` | raised surfaces |
| `--color-ink` | `oklch(97.8% 0.002 146)` | light text |
| `--color-teal` | `oklch(55% 0.04 30)` | secondary accent (muted red-gray) |
| `--color-orange` | `oklch(53.8% 0.208 27)` | primary accent (red) |
| `--color-orange-2` | `oklch(63% 0.16 27)` | accent hover/light |
| `--color-accent-ink` | `oklch(18% 0.003 1)` | text on accent |
| `--color-focus` | `oklch(68% 0.17 27)` | focus ring |

## Rebrand = change ONLY these

- business name + phone (`864-642-7705`, display AND `tel:` link)
- tagline + hero headline ("Tree Service You Can Trust")
- trust-marquee proof points (VERIFIED only — this build DROPPED the self-claimed "licensed & insured" because it wasn't verified)
- services list (text + icons)
- reviews (VERBATIM only — this demo shows only the 1 verified quote (Ken Lovingood) + platform stats "Google 5.0★ (5 reviews)" / "Facebook 100% recommend (13 reviews)"; never fabricate)
- about text + owner name (Christopher McCollum — verified via SC SOS)
- service-area wording (Anderson, SC → client's area)
- images: `hero.mp4`/`hero.webm` + `hero-poster.jpg`, `services-bg.jpg`, `work-a…d.jpg`, `logo.png` + `logo-bg.jpg`

## Verification (run before showing Zach)

- enumerate all `src`/`poster`/`url()` refs → HTTP 200 against live URL
- dual-viewport (1280 + 390) Gemini vision: confirm the services image is VISIBLE + text readable
- `check_redundancy.py` guardrail (venv python)
- no leftover "Lumberjack" / old phone / old area strings
