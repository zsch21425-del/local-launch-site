# BRIEF — FIX Home Projects LLC (custom decks, porches & handyman)

## Client facts (REAL, verified)
- Business: FIX Home Projects LLC
- Phone: (864) 918-4947 — tel: href MUST be `+18649184947` (E.164, 12 chars, NO double-1)
- City / service area: Greenville, SC
- Owner: TBD
- Services (use EXACTLY these): Custom Decks, Porches, Handyman Repairs, Outdoor Living
- Tagline direction: "Custom decks & home projects, Greenville" (keep it human, no AI-speak)
- Brand colors: NOT researched yet — check their Facebook/logo/socials via the web; if none found, use a tasteful dark + accent placeholder and note it as swappable. NEVER use Local Launch teal/slate (#21A9A8/#2D3338).
- Visualizer: NO — not a transform trade, no visualizer needed.

## Build instructions
- Fork the `handyman` template ALREADY COPIED into this directory (index.html + assets). Do NOT redesign sections — rebrand only.
- Change ONLY: brand name, phone (+ tel: href), city/service-area copy, services list, reviews (verbatim only — use real quotes if available, else honest proof points like "years in business" / "recommended on Nextdoor"; NEVER a made-up star count), images, logo/icon, colors, meta/og tags.
- REMOVE every leftover string from the template's previous client (name, phone, city, owner) — grep and clear them all.
- Keep: the premium structure, video hero, section layout, and all design treatment.

## Verification (before you report done)
- `tel:` href must regex-match `^\+1\d{10}$` exactly (12 chars).
- Enumerate every `src`/`poster`/`url()` and confirm each media file exists in this dir (no broken refs).
- Grep for the template's previous-client name/phone/city — must return ZERO.
- No CSS syntax errors; no leftover `{PLACEHOLDER}` tokens.

HARD RULES (apply ALL — these were hard-won from many Zach rejection rounds, DO NOT omit any):
0. WORK FROM THE GRAFT GRAPH (2026-08-16) — /mnt/d/LocalLaunch has Graft wired into Claude Code. Use `graft map`, `graft grep "<term>"`, `graft ask "<symbol-or-file>"`, `graft skeleton <file>` to find the template + deploy conventions instead of re-reading the repo. ⚠️ Prose `graft ask "where is X?"` needs `--deep` (not built) — phrase as a symbol/filename. Run `graft check` to confirm the graph is fresh. (If this is a pure in-dir fork of the template already copied here, graft=0 is acceptable and expected.)
0a. CLIENT BRAND COLORS (research first, never guess) — color the demo to the CLIENT's real brand, researched from their logo / socials / flyers / uniforms / equipment BEFORE building. Replace the template's previous-client palette with the client's researched accent + dark colors. Local Launch's own teal/slate (#21A9A8/#2D3338) is ONLY for locallaunchupstate.com — never a client demo. If the client's brand can't be found, say so and use a clearly-swappable tasteful dark+accent placeholder, never guess.
1. VISUALIZER FOR TRANSFORM TRADES — if the trade is concrete/pour/finish, pressure washing, painting, or junk removal, the demo MUST include a before/after visualizer slider. This is a MAJOR selling point. Do NOT omit it (see VISUALIZER flag in the client facts below).
2. REAL HD BACKGROUND IMAGES on every major section (hero, services, about). NO plain solid-color backgrounds for cards/sections — every service card gets a high-def trade image with a dark scrim so white text stays readable. NO flat white cards, NO flat color-gradient cards.
3. PREMIUM DEPTH CARDS — light/frosted cards elevated OFF a dark gradient section: near-white surface rgba(255,255,255,0.92), backdrop-filter blur, soft diffused shadow, rounded 18-22px, dark titles + colorful gradient icon badges.
4. QUALITY TRADES — real/video hero backgrounds (autoplay muted loop playsinline + poster), award-quality finish, NO clearly-AI imagery (no gibberish text/uncanny hands/plastic textures), NO "2010-era" plain look.
5. EVERY image distinct — services=4 unique trade photos, gallery=4 DIFFERENT unique photos, about=own wide photo. No reusing the same image across sections.
6. NO SVG, NO fake/placeholder data, real phone/owner/reviews or honest placeholders, trade-specific hero video (no off-trade footage).
7. Poster = the video's exact first frame (ffmpeg -vframes 1).
8. FIRST-ITERATION CORRECTNESS: (a) Recolor EVERY hardcoded rgba() — the nav background, hero overlay, AND services scrim use literal rgba() left over from the template's previous client. Grep for the OLD rgba() values and replace ALL with the client's brand-dark RGB; changing only :root CSS vars is NOT enough. (b) The services-section shade gradient must FILL THE FULL SECTION — no white or near-black fallback showing. (c) Every gallery image ⇔ caption must MATCH and be ON-TRADE. (d) No CSS syntax errors (a stray `;,` silently invalidates a property). (e) Never reuse the hero video's poster frame as a gallery image (duplicate → critic fails).
9. NEVER CITE AN UNVERIFIED REVIEW COUNT/RATING — if the brief/lead gives a count that wasn't verified signed-in, DO NOT put it on the demo. Cite only verbatim customer reviews you HAVE plus proof points (years in business, "Neighborhood Favorite"), never a made-up star count.
10. LIGHT BRAND COLORS → DARK SCRIMS, NOT THE BRAND COLOR — scrims/overlays (nav background, .hero-overlay, .reviews-scrim, services gradient) must be a DARK NEUTRAL (black or warm charcoal ~rgb(43,37,32)) at the same opacities; the BRIGHT brand color is for ACCENTS ONLY (buttons, icon chips, links, glows). Dark brands (navy/green/slate) may keep their own dark shade as scrims. Grep every rgba() inside a background/gradient/overlay/scrim selector — must be DARK (black or luminance <50%).
NOTE: The SUPERVISOR runs the QA gates (redundancy guardrail, Camoufox dual-viewport vision, blind critic) AFTER your build — do NOT attempt to run them yourself (they need the venv python + Camoufox + Gemini that aren't set up in your session, and attempting them wastes turns). Your job is ONLY the rebrand + the SELF-CERTIFY line below, then report. (If VISUALIZER=YES in the client facts, build the visualizer; the supervisor verifies it.)
SELF-CERTIFY at the end, IN YOUR TERMINAL REPORT ONLY (do NOT write the checklist into index.html as HTML/CSS comments — that leaks old-client strings and trips the grep leak-check): "graft-used=YES/NO, visualizer=YES/NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES/NO, rgba-recolored=YES, services-bg-full=YES, scrims-dark=YES/NO, checked-1280&390=YES".

SELF-CERTIFY (terminal report only, one line): graft-used=YES/NO, visualizer=YES/NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES/NO, rgba-recolored=YES, services-bg-full=YES, scrims-dark=YES/NO, checked-1280&390=YES.
