# Builder Brief — JTP Demo: Fix Hero Start + Services White Border

You are the BUILDER agent. Fix two specific bugs in the JTP Lawn Care and Junk Removal demo (`index.html` in this directory). Keep everything else as-is.

## Bug 1 — Hero doesn't start with the moving background video
When the page loads, the hero shows a DIFFERENT (plain/static) background until the video kicks in. It must show the moving background video immediately.
- The hero uses `<video class="hero-bg">` with `jtp-hero.mp4` (poster `jtp-hero-poster.jpg`), but it's heavily darkened with `filter: brightness(0.5)` and there's a flash of a different background before the video paints.
- **Fix:** (a) the hero must display the video from the first paint — set the section background to match the video/poster so there's no flash of a different color, and ensure the video element covers the full hero immediately (`preload="auto"` is set, keep it). (b) Do NOT over-darken it — the user wants to SEE the moving background (mowing + junk removal). Reduce/remove the heavy `brightness(0.5)` so the video is clearly visible, while keeping text readable with a lighter overlay scrim.

## Bug 2 — White border around the services background
In the services section, the dark green background does NOT fill the full screen — there's a visible WHITE border/edge around it on mobile.
- Root cause: the page `body` background is `--paper: #FAF7F2` (white/cream). The services section content is centered in a `max-width: 1200px` container, so the white page background shows around the dark services area on mobile.
- **Fix:** the services section background must fill the ENTIRE screen edge-to-edge (no white border). Make the services section's dark background span full width, or set the section's own full-bleed background so no page-white shows around it. The dark green services background should reach the left and right edges of the screen on mobile AND desktop.

## Constraints
- Keep the design premium, keep the HD service card images (svc-lawn.jpg etc.) as-is.
- Responsive: correct on mobile (390) AND desktop (1280).
- Do NOT change phone/email/contact info.
- Only edit `index.html` in this directory.

## Output
Report concisely (under 150 words): what you changed for (a) hero video start, and (b) services full-bleed background, and confirm both are fixed.
