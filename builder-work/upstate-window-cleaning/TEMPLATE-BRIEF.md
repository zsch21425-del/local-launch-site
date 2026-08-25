# Pressure Washing Template — CANONICAL (approved by Zach 2026-08-22)

**Source:** Elite Sweep Property Cleaning demo (`elite-sweep-cleaning-demo.vercel.app`) — rebuilt on the premium system after Zach rejected the old B&M dark-glass build.
**Use for:** pressure washing / soft wash / driveway-cleaning / exterior-cleaning prospects.

## ⚠️ Premium OKLCH system (same family as tree-service + cleaning + concrete)

- **Colors are OKLCH** — all in `:root` as `--color-*` vars (this build uses a teal/cyan clean-water palette).
- **Fonts:** "Big Shoulders Display" (display) + "IBM Plex Sans" (body).
- **Signature:** video hero + scrolling `trust-marquee` + **sticky VIDEO background with frosted-glass service cards** + the **AI before/after visualizer**.

## Structure (copy EXACTLY — do not redesign)

1. **Video hero** — `<video class="hero__video">` (`pw-street-web.mp4` + poster), autoplay/muted/loop, dark scrim, no logo in hero.
2. **Trust marquee** — scrolling proof strip.
3. **Services "What We Clean"** — **sticky VIDEO** (`pw-reviews-web.mp4`, the water-running-down-drain clip) pinned to viewport + frosted-glass cards + dark scrim.
4. **VISUALIZER** — "See It Before We Clean It" before/after slider (`driveway-before-real.jpg` vs `driveway-after-real.jpg`) + "Use My Photo" upload → POSTs to `/api/clean-driveway` (Flask serverless, uses GEMINI_API_KEY). **REQUIRED for this transform trade.**
5. **Gallery** → **reviews** → **service area** → **CTA** → **footer**.

## 🔑 Key implementation notes

- **Sticky services bg is a VIDEO, not an image:** `.services-bg` is `position:sticky; top:0; height:100dvh; margin-bottom:-100dvh; z-index:-1; overflow:hidden` with a `<video>` (absolute, `object-fit:cover`) + a `.services-bg__scrim` (dark gradient) inside.
- **The visualizer slider must have `id="viz-slider"`** on the drag container — the JS does `getElementById("viz-slider")` for the pointer handlers. Dropping this id breaks the drag silently.
- **Buttons are clean text (no emoji)** — `btn--primary` "Clean My Driveway" + `btn--ghost` "Use My Photo".
- **The visualizer serverless function needs `requirements.txt` (`flask>=2.0`)** — Vercel fails with `FUNCTION_INVOCATION_FAILED` without it.

## Rebrand = change ONLY these

- business name + phone (`(937) 776-4600`, display AND `tel:` link) + service-area wording (Kettering/OH → client's area)
- brand colors in `:root` (teal/cyan → client's researched brand; scrims stay DARK neutral, brand color = accents only)
- services list (4 cards) + trust-marquee proof points
- reviews (VERBATIM only — this build shows 2 quotes (connie thom + Laura Showalter) + "5.0★ / 8 Google reviews"; never fabricate)
- about text (women-owned here → client's own story; no invented owner)
- images: `pw-street-web.mp4` + poster, `pw-reviews-web.mp4` + poster, `svc-*.jpg`, `driveway-before/after-real.jpg`, `logo.png`
- **`api/clean-driveway.py`** — update the `SAMPLE_URL` fallback (`elite-sweep-cleaning-demo.vercel.app`) to the new client's demo slug

## Verification (run before showing Zach)

- enumerate all `src`/`poster`/`url()` refs → HTTP 200 against live URL
- `/api/clean-driveway` GET returns `{"ok":true}`
- dual-viewport (1280 + 390) vision — confirm the sticky video bg + cards read
- `check_redundancy.py` guardrail (venv python)
- no leftover "Elite Sweep" / old phone / old area strings
