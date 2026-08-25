# Builder Brief — Zeroscapes desktop hero headline obstruction (round 5, final)

You are the BUILDER agent. One remaining desktop issue on `/mnt/d/LocalLaunch/builder-work/zeroscapes/index.html`: on DESKTOP, the hero headline text "Low Maintenance." slightly overlaps the landscaper's arm/tool in the background video/image, which reads as sloppy against award-winning standards. Mobile is already 9.5/10 — do NOT touch mobile behavior.

## The fix
Add a **soft, localized dark scrim BEHIND the hero text content** so the headline reads cleanly without overlapping the subject — but do NOT darken the whole video (it's correctly bright). Options (pick the best):
1. Give `.hero-content` (or a wrapper around the hero text) a subtle radial/linear dark gradient background (e.g. `background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(16,51,31,0.45), transparent 70%)` or a horizontal linear gradient) with `padding` so the text has a soft dark halo that separates it from the background subject. Keep it light enough that the video still shows.
2. OR increase the hero-overlay's center darkness just behind the text block.

Goal: headline fully readable with NO element of the background image crossing through the text, while the video stays bright. Keep desktop AND mobile both working (verify the scrim doesn't break mobile — but it only needs to fix desktop).

## Verify
- Desktop: headline text no longer overlaps the subject; video still bright.
- Mobile: unchanged (9.5/10).

## Output
Report concisely: what scrim you added.
