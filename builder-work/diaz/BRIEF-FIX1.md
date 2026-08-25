# Builder Brief — Diaz hero contrast fix (critic round 1)

You are the BUILDER agent. Fix the hero TEXT CONTRAST on `/mnt/d/LocalLaunch/builder-work/diaz/index.html`. A strict critic scored the hero 6.8/10 — the white sub-headline and trust badges are hard to read over the bright snow/green hero image (white text on white snow = invisible).

## The fix (proven Local Launch pattern — video stays bright, text gets shadows)
1. Give `.hero h1`, `.hero h1 .accent`, `.hero .subtitle`, `.hero-proof`, `.hero-badge` a **strong layered text-shadow** (e.g. `text-shadow: 0 2px 12px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)`; accent slightly stronger).
2. Bump `.hero .subtitle` and `.hero-proof` to near-white `rgba(255,255,255,0.97)` + font-weight 400.
3. Add a **soft localized dark scrim behind the hero content block** (`.hero-content` or a wrapper): a subtle radial/linear dark gradient (e.g. `radial-gradient(ellipse 75% 65% at 50% 50%, rgba(16,51,31,0.45), transparent 70%)` with padding) so text reads cleanly over the busy bright image — WITHOUT darkening the whole video.
4. Keep the hero video bright. Do not redesign anything else. Mobile must still work.

## Verify
- Grep that the shadows + scrim are present. The sub-headline, trust badges, and top "4.6★" badge are readable over the image.

## Output
Report concisely: what you changed.
