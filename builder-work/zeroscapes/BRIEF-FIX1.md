# Builder Brief — Zeroscapes hero text contrast fix (critic round 1)

You are the BUILDER agent. Fix the hero TEXT CONTRAST on `/mnt/d/LocalLaunch/builder-work/zeroscapes/index.html`. A strict critic scored the hero 4.5/10 because the headline and trust signals are hard to read over the bright background video. The video is correctly bright (do NOT darken it) — the fix is stronger text contrast via shadows + color weight.

## The exact problems (critic feedback)
1. **"Low Maintenance." accent text** (light green `--accent-light`) is nearly invisible where it overlaps bright shrubs/person. It needs a strong dark shadow so the light-green reads.
2. **Sub-headline** ("Landscape design, drainage, hardscaping & supplies...") and the **trust signals** (Google 4.8★, Nextdoor 2024, 15+ yrs) are small + low-contrast grey — hard to read.
3. **Nav brand** uses a serif that clashes with the logo's sans-serif (minor — improve cohesion if easy).

## Fix (apply to the hero, keep the bright video)
- Give `.hero h1`, `.hero h1 .accent`, `.hero .subtitle`, `.hero-proof`, `.hero-badge` a **strong, layered text-shadow** so they're readable over ANY background (e.g. `text-shadow: 0 2px 12px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)` and for the accent a slightly stronger one). This is the proven Local Launch pattern — the video stays bright, the text gets enough shadow to read.
- Bump `.hero .subtitle` and `.hero-proof` to near-white (`rgba(255,255,255,0.95)`) and slightly larger (subtitle font-weight 400).
- Keep the overlay as-is or slightly reduce it (it's already light) — do NOT add a heavy dark scrim over the bright video.
- Keep the logo/video/colors unchanged otherwise. Do not redesign anything else.

## Verify
- Grep that the text-shadow values are present on hero h1/accent/subtitle/proof/badge.
- Do NOT change anything outside the hero styling.

## Output
Report concisely: what you changed and confirmation the hero text now has strong shadows.
