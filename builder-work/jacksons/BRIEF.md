# Builder Brief — Jackson's Junk and Stuff Demo (rebrand from JTP design)

You are the BUILDER agent. Rebrand the JTP Lawn Care demo into a JACKSON'S JUNK AND STUFF demo. The design (structure, hero video treatment, service cards) is approved and stays. Change the CONTENT and ASSETS to Jackson's.

## Files in this directory `/mnt/d/LocalLaunch/builder-work/jacksons/`
- `index.html` — the JTP demo to REBRAND (edit this)
- `deploy.py` — already points to `jacksons-junk-demo` (do not change PROJECT)
- `jacksons-logo.png` / `jacksons-logo.jpg` — their logo (use in nav + where JTP logo was)
- `junk-hero-web.mp4` + `junk-hero-poster.jpg` — JACKSON'S real hero video (junk removal — loading furniture/appliances into truck). Use this as the hero video, replacing jtp-hero.mp4.
- `junk-before-real.jpg` / `junk-after-real.jpg` — real before/after junk photos (can use in a before/after or about area if the design has one; otherwise optional)
- The JTP service images (svc-lawn.jpg, svc-junk.jpg, etc.) are NOT in this folder — do not reference them. Jackson's is JUNK REMOVAL ONLY (no lawn care).

## Business facts (use these EXACTLY)
- **Name:** Jackson's Junk and Stuff
- **Location:** Greenville, SC (serves 6-city area: Greenville, Mauldin, Simpsonville, Fountain Inn, Greer, Easley)
- **Phone:** (864) 449-4987
- **Owners:** brothers Ryan & Zach Jackson — family-owned
- **Tagline:** "You Don't Lift It, We Shift It."
- **Positioning:** Same-day junk removal, family-owned, honest pricing. Active on Instagram with before/after photos.
- **They have NO real website** — this demo IS their site proposal. (A `jacksons-junk.vercel.app` exists but is OUR old demo, not theirs. Do NOT claim they have a site; pitch angle = new site build.)

## Services (JUNK REMOVAL ONLY — replace JTP's lawn care/junk mix)
Use these 4 service cards (HD images needed — see below):
1. **Furniture & Appliances** — couches, mattresses, washers, dryers, fridges — we haul it all.
2. **Garage & Yard Debris** — old equipment, lumber, brush, yard junk — cleared out.
3. **Attic & Garage Cleanouts** — years of clutter gone in one visit.
4. **Estate & Home Cleanouts** — full-house cleanouts done respectfully, fast.

## Hero video
Use `junk-hero-web.mp4` full-bleed as the hero background (object-fit cover, same treatment as JTP — bright enough to see clearly, overlay + text-shadow for readability). Poster = `junk-hero-poster.jpg`.

## Images for the 4 service cards
The svc-*.jpg files are NOT in this folder. Generate/obtain 4 HD junk-removal images yourself:
- You may create simple HD placeholder image files (e.g., via a solid color or by reusing junk-before/after where relevant) — BUT the better move: reuse `junk-before-real.jpg` / `junk-after-real.jpg` for TWO of the cards (Furniture & Appliances, Estate & Home Cleanouts) and create two more via whatever means you have (e.g., copy/duplicate the real photos with different crops). Keep it HD and on-topic. No lawn mowing imagery anywhere.

## What to change from the JTP template
1. Title/description/og tags → Jackson's Junk and Stuff, Greenville SC.
2. Nav brand → Jackson's Junk and Stuff (use jacksons-logo.png in nav if the template had a logo image; otherwise text brand).
3. Hero: badge "Family-Owned — Greenville SC", headline (e.g., "You Don't Lift It.<br>We Shift It."), subtitle about same-day junk removal across the Upstate, proof badges (Family-Owned / Same-Day Service / Honest Pricing / ★★★★★ from real reviews), CTA phone (864) 449-4987.
4. Services section: "What We Haul" — the 4 junk services above with HD images.
5. Why/About: family-owned brothers Ryan & Zach Jackson, 6-city service area, Instagram before/after, "you don't lift it, we shift it."
6. Reviews: junk-removal appropriate (if template has placeholder reviews, keep generic-but-real-sounding, no made-up specific names).
7. Footer/CTA contact: phone (864) 449-4987, Local Launch footer unchanged (logo-bg.jpg is NOT in this folder — remove the Local Launch logo image reference or use a text fallback so the page doesn't 404).
8. Remove ALL lawn-care references (mowing, mulch, etc.).

## Constraints
- Keep the JTP design/layout (hero video + overlay text, HD image service cards, premium dark theme).
- Responsive mobile (390) + desktop (1280). No white borders around sections (services background must fill edge-to-edge — keep the fix that was applied).
- No "no website" CLAIM in the demo itself is fine, but don't link to a fake site.
- Verify all file references exist in this directory (no 404s): check every img/video src.

## Output
Report concisely (under 150 words): what you rebranded, the 4 service cards + images used, hero video used, and confirm no broken file references.
