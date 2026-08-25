# Builder Brief — Zeroscapes hero round 2 (critic round 2)

You are the BUILDER agent. Two remaining hero readability issues on `/mnt/d/LocalLaunch/builder-work/zeroscapes/index.html`. The critic (score 6.0/10) confirmed the subtitle + trust TEXT are now white/readable, but flagged:

1. **`"Low Maintenance."` accent text (`.hero h1 .accent`)** is light-green and STILL not reliably readable where it overlaps bright foliage/person. Fix: make the accent a **brighter, higher-contrast color** that still fits the brand — either a much lighter/luminous green (e.g. `#9CCC65` lime / `#B7E06D`) OR white. Keep the dark shadow. The goal: instantly readable over ANY background.
2. **Trust signal ICONS** (`.hero-proof i` / `.hero-proof .fa-*` for the Nextdoor trophy and 15+yr leaf) are dark-green on the dark hero → invisible. Fix: color them **white or the bright accent green** (match the CTA buttons) so they're visible, with the same text-shadow as the proof text.

Keep everything else identical (subtitle already white, video bright, no new scrim). Do not redesign anything else.

## Verify
- Grep `.hero h1 .accent` color is now a bright high-contrast value, and `.hero-proof i` (icons) is white/accent.

## Output
Report concisely: the accent color + icon color you set.
