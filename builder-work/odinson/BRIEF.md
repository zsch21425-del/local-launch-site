# Builder Brief — Odinson Electric Demo (Hero Section Fix)

You are the BUILDER agent for Local Launch. Fix the hero section of the Odinson Electric demo website so it looks premium and correct on BOTH desktop and mobile.

## Current problem (Zach's feedback)
1. The hero logo video is CUT OFF at the top — shows as a black box that doesn't fit the mobile screen.
2. The hero video must be the sole focal point at the top (Viking logo, no text over it), with the headline + trust badges + CTA buttons in a separate section BELOW it.
3. It must look good on mobile (390px) and desktop (1280px) — no cropping, no black boxes, no text overlap.

## File
- `/mnt/d/LocalLaunch/builder-work/odinson/index.html` — edit this file.
- The hero uses `<video class="hero-bg-video">` with `od-hero-logo.mp4` (a square Viking logo video).

## Design requirements (from the demo-standards skill)
- Dark premium theme, neon green/cyan/purple (Odinson Viking brand).
- Hero: full Viking logo video centered, NO text over it.
- Below the video: headline "Real Power. Handled Safely.", short description, trust badges (5.0 Google · 110 Reviews, BBB A-, 3-Year Guarantee), CTA buttons (call + Our Services).
- Responsive: must fit both desktop (1280) and mobile (390) without the video being cut off or showing a black box.
- Keep it professional and premium. Do NOT introduce AI-flavored text.

## Instructions
1. Read the current index.html.
2. Fix the hero so the video fits the screen correctly on desktop AND mobile (use object-fit/contain, correct aspect ratio, no overflow). The square logo video must be fully visible with no cropping and no black-box edges.
3. Ensure the text section below the video is well-laid-out and readable.
4. Verify by opening the file and checking the structure. You can use `python3 -c "..."` to sanity-check the HTML, and note any obvious issues.

## Output
Report what you changed and confirm the hero video fits on mobile without a black box. Keep your final report concise (under 200 words).
