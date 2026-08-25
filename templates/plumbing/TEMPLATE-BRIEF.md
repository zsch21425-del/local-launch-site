# Plumbing Template — CANONICAL (premium OKLCH, approved by Zach 2026-08-22)

**Source:** Cooper's Plumbing Company Inc demo (`coopers-plumbing-demo.vercel.app`).
**Use for:** plumbing, drain cleaning, water heaters, general plumbing repair, emergency plumber.

## ⚠️ Premium OKLCH system (same family as `tree-service/`, `cleaning/`, `concrete/`, `pressure-washing/`, `painting/`)

- **Colors are OKLCH** (not hex) — all in `:root` as `--color-*` vars.
- **Fonts:** "Big Shoulders Display" (display) + "IBM Plex Sans" (body).
- **Signature:** video hero + scrolling `trust-marquee` + **sticky HD background with frosted-glass service cards** + gallery + testimonials + service area + contact + Local Launch footer.

## Structure (copy EXACTLY — do not redesign)

1. **Video hero** — full-bleed `<video class="hero__video">` (`hero.webm` + `hero.mp4` + `hero-poster.jpg`), real on-trade video, autoplay/muted/loop. No hero logo (text nav brand only).
2. **Trust marquee** — scrolling proof strip (VERIFIED points only — this build dropped "24/7", "licensed & insured", "free estimates" because none were verified).
3. **Services "What We Do"** — **4 service cards** (down from tree's 6) + sticky HD image bg (`services-bg.jpg`) + frosted-glass cards.
4. **About** — owner story + stat ("40 Years of Family Service") + badges + proof.
5. **Gallery** — `work-a.jpg` → `work-d.jpg` (4 distinct on-trade images).
6. **Testimonials → service area → contact → footer.**

## Brand colors (OKLCH — swap to client's brand on rebrand)

| Var | Value | Role |
|---|---|---|
| `--color-paper` | `oklch(22.1% 0.003 248)` | dark charcoal page bg |
| `--color-paper-2` / `-3` | `oklch(31%/35% 0.004 248)` | raised surfaces |
| `--color-ink` | `oklch(97.5% 0.002 146)` | light text |
| `--color-teal` | `oklch(45% 0.03 25)` | muted secondary accent |
| `--color-orange` | `oklch(48.5% 0.15 26)` | primary accent (red #a3312f) |
| `--color-orange-2` | `oklch(54.3% 0.174 30)` | accent hover (#c0392b) |
| `--color-accent-ink` | `oklch(18% 0.003 1)` | text on accent |
| `--color-focus` | `oklch(62% 0.15 28)` | focus ring |

**Rule:** scrims/overlays stay DARK charcoal; the accent is for buttons/icon chips/badges/focus only.

## Rebrand = change ONLY these

- business name + phone (`(803) 648-0203`, display AND `tel:` link) + email (`coopersplumbinginc@gmail.com` → client's)
- tagline + hero headline ("Plumbing Done Right Since 1985")
- trust-marquee proof points (VERIFIED only)
- 4 services (text + SVG icons: wrench/droplet/flame/pipe)
- reviews (VERBATIM only — this demo shows 2 BestProsInTown quotes, **no star rating** because Cooper's is a low 3.2★)
- about text + owner name + stat years
- service-area wording ("Aiken & the CSRA" → client's area)
- images: `hero.mp4`/`hero.webm` + `hero-poster.jpg`, `services-bg.jpg`, `work-a…d.jpg`, `logo-bg.jpg`

## ⚠️ Pitfalls hard-won on this build (do NOT repeat)

1. **NO STAR RATING on low-rated clients.** Cooper's is 3.2★ — the demo shows only verbatim quotes + "since 1985", zero stars. Never add stars the business hasn't earned.
2. **No fabricated badges.** The first pass leaked a "Same-Day Service" badge (unverified) — caught + replaced with "Serving Aiken & the CSRA". Verify every badge against the research fact sheet.
3. **Dead tree SVG symbols.** The fork left `i-tree`/`i-pruning-shears`/`i-stump`/`i-bucket-truck` symbol defs (unused). Grep `<symbol id=` and remove any icon from the previous trade.
4. **Gallery vs hero/services must be DISTINCT scenes.** `work-a.jpg` (faucet frame) was 93% similar to `hero-poster.jpg` (same video) and `services-bg.jpg` (drain) was 99% similar to a drain gallery frame. Fix = generate distinct images (leak pipe / drain snake / water heater / under-sink), never reuse a video frame as both bg + gallery.
5. **`services-bg.jpg` should be TEXTURED / medium-tone** (like tree's wood chips), not a flat bright/white scene — the frosted glass reads best over texture. If the client's trade image is bright, apply a strong dark scrim or swap to a textured still.

## Verification (run before showing Zach)

- enumerate all `src`/`poster`/`url()` refs → HTTP 200 against live URL
- dual-viewport (1280 + 390) Gemini vision: services image VISIBLE, text readable, no red wash (scrims dark)
- `check_redundancy.py` guardrail (venv python) + `check_image_redundancy.py` aHash (99% = real dup → fix; 56-69% = dark-palette false positive → ignore after vision confirms distinct)
- grep 0 leftovers: old client name / phone / city / trade strings / `Same-Day` / star glyphs
