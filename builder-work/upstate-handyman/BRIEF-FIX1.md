# Builder Brief — Upstate Handyman mobile hero contrast fix (critic round 1)

You are the BUILDER agent. Fix MOBILE text contrast on `/mnt/d/LocalLaunch/builder-work/upstate-handyman/index.html`. Desktop is 9.2/10, but MOBILE is 6/10: the sub-headline ("Repairs, landscaping, pressure washing & renovations...") and the proof items ("Nextdoor Neighborhood Favorite", "20+ Years Experience") sit over a BRIGHT sunlit green lawn with insufficient scrim → white text on bright green = hard to read on small screens.

## The fix (strengthen the hero-content scrim + shadows, mobile especially)
1. Strengthen `.hero-content` background scrim: make the radial/linear dark gradient **stronger behind the lower text block** (e.g. raise the mid rgba alpha from ~0.22 to ~0.4, and/or add a `linear-gradient(180deg, transparent 30%, rgba(16,51,31,0.5) 100%)` overlay so the bottom half where sub-headline + proof sit gets darker). Keep the house/roof visible at top.
2. Bump `.hero .subtitle` and `.hero-proof` text-shadow to stronger values (e.g. `0 2px 12px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.9)`) and font-weight to 500 so they hold on bright grass.
3. In the mobile media query, ensure `.hero-content` gets a slightly stronger scrim and the sub-headline/proof stay near-white `rgba(255,255,255,0.97)`.

Keep the hero video bright, don't redesign. Desktop must stay 9.2 (don't darken the whole image, just behind text).

## Verify
- Grep scrim/shadow values updated. On mobile the sub-headline + proof items read clearly over the lawn.

## Output
Report concisely what you changed.
