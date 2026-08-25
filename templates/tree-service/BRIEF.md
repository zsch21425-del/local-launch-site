# Builder Brief — Lumberjack Tree Service (Anderson, SC)

Rebrand the premium concrete template (already in this dir: `index.html`) into a **TREE SERVICE** demo. This is the OKLCH premium design system Zach approved. **REBRAND ONLY — do NOT redesign the layout, sections, or CSS structure.**

## HARD RULES (concrete premium system)
1. **OKLCH colors only** — every color is a `--color-*` var in `:root` using `oklch(...)`. Do NOT introduce hex colors.
2. **Fonts:** "Big Shoulders Display" (display) + "IBM Plex Sans" (body) — keep the Google Fonts link intact.
3. **Section order unchanged:** nav → hero → trust-marquee → services → work gallery → about/reviews → service area → CTA → footer.
4. **Hero:** static is fine — use `hero-poster.jpg` as the hero background (there is no hero.mp4 in this dir; do NOT reference a missing video).
5. **Images:** no people, no text, no watermark; distinct scenes; trade-correct (trees/tree work).
6. **Facts VERBATIM from BUSINESS DATA below.** No invented reviews, ratings, or years. **Do NOT claim "licensed & insured"** (self-claimed, unverified). Only 1 verbatim review exists — do not fabricate more.
7. **Dual-viewport QA** at 1280px and 390px.
8. **Zero template-leak** — no "Brian Dillard", "Concrete", "Roebuck", "Driveways/Patios" leftovers anywhere.

## BUSINESS DATA (VERIFIED — do NOT invent)
- Name: **Lumberjack Tree Service**
- Owner: **Christopher McCollum**
- Phone: **(864) 642-7705** → `tel:+18646427705`
- Email: **Ljtreeserviceasc@gmail.com**
- Area: **Anderson, SC & surrounding areas**
- Tagline: **"Tree Service You Can Trust — Even in the Toughest Spots"**
- Years: **12 years in business** (est. 2014, verified)

## BRAND COLORS (exact OKLCH — red/dark-gray/white only)
- Primary accent (red): `oklch(0.538 0.208 27)`  → replaces `--color-orange` + `--color-focus`
- Lighter accent (lighter red): `oklch(0.63 0.16 27)` → replaces `--color-orange-2`
- Dark surfaces (gray): `oklch(0.330 0.002 326)` → replaces `--color-paper-2` / `--color-paper-3`
- Page bg (near-black): `oklch(0.24 0.006 1)` → replaces `--color-paper`
- Light ink (white): `oklch(0.978 0.002 146)` → replaces `--color-ink`
- Secondary accent (was `--color-teal`): map to a **desaturated warm red-gray** in the same red family (do NOT use green/blue/teal).
- **Red is the ONLY accent hue.** Derive lighter/darker shades of these three hues (red / dark-gray / white) for hover, rules, and muted states. Do NOT introduce any other hue.

## SERVICES (6 icon cards — use these exact labels)
1. Tree Removal
2. Tree Trimming
3. Stump Grinding
4. Storm Damage & 24/7 Emergency
5. Hazard Tree Removal
6. Bucket Truck & Climbing

## TRUST MARQUEE (scrolling proof strip — these exact points)
12 Years in Business · 24/7 Emergency Service · Free Estimates · Veteran & Senior Discounts · Residential & Commercial

## REVIEWS (1 verbatim only)
- *"They have done a great job for us several times. Best team."* — Ken Lovingood, Facebook
- Aggregates (cite as stats, not quotes): **Google 5.0★ (5 reviews)** · **Facebook 100% recommend (13 reviews)**

## ABOUT
Christopher McCollum runs Lumberjack Tree Service out of Anderson, SC — 12 years of safe, reliable tree work across the Upstate. Removal, trimming, stump grinding, and 24/7 storm response, with a bucket truck and experienced climbers. Free estimates, and discounts for veterans and seniors.

## IMAGES (already generated in this dir — wire them in)
- `hero-poster.jpg` → hero background
- `work-a.jpg`, `work-b.jpg`, `work-c.jpg`, `work-d.jpg` → work gallery (4)
- **No logo image** — use a clean text wordmark "Lumberjack Tree Service" in the nav (do NOT fabricate a logo).

## SELF-CERTIFY (REQUIRED in final report)
- [ ] OKLCH only; red/dark-gray/white brand (no hex, no green/blue/teal)
- [ ] Trust marquee + work gallery + all sections in original order
- [ ] Images trade-correct + distinct, no people/text/watermark
- [ ] Facts verbatim; 1 review only; NO "licensed & insured" claim
- [ ] Dual-viewport clean at 1280 + 390
- [ ] Zero template-leak (no Brian Dillard / Concrete / Roebuck / driveway/patio)
