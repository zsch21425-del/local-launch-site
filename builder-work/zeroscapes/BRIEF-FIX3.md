# Builder Brief — Zeroscapes mobile nav fix (critic round 4)

You are the BUILDER agent. Fix ONE mobile bug on `/mnt/d/LocalLaunch/builder-work/zeroscapes/index.html`: on MOBILE viewport (~390px), the "Wellford" location text in the header is cut off on the right edge.

## The fix (proven Local Launch pattern)
In the `@media(max-width:720px)` (or 640px) mobile media query:
1. Make sure `.nav-cta` (the "Free Estimate" button) has `white-space: nowrap` so it doesn't wrap.
2. Reduce nav spacing / padding and shrink the brand/logo so the brand + location + CTA all fit on one mobile row without any text clipping on the right edge. Options: smaller nav padding, smaller logo max-height on mobile, hide or truncate the "Wellford" location text on very small screens if needed to prevent clipping.
3. Ensure `.nav-links a:not(.nav-cta)` are hidden on mobile (the standard pattern) so the header only shows brand + CTA.

Keep everything else unchanged. Do not redesign.

## Verify
- The header on mobile shows the brand + "Free Estimate" button fully, with no text cut off on the right edge.

## Output
Report concisely: what you changed for the mobile header.
