# Builder Brief — Scott Handiworks (rebrand handyman template)

You are the BUILDER agent. Rebrand `index.html` in THIS directory (a fork of the approved "Upstate Handyman and Landscaping" template — it currently contains Kevin Pang / Simpsonville / 864-918-5096 data). Replace ALL of that with the client below. All required images are already in this directory.

## BUSINESS DATA (verified — do NOT invent)
- **Name:** Scott Handiworks
- **Owner:** Matthew Scott
- **Phone:** 864-626-2908 · tel link `tel:+18646262908`
- ⚠️ IMPORTANT: do NOT use (864) 634-9487 anywhere — that number belongs to a different business.
- **Service area:** Liberty, SC — serving Liberty, Clemson, Central, Easley, Anderson (also Pickens / Oconee / Abbeville)
- **Proof points:** "Free quotes, great rates" (from his own posts) · FB page "Carpenter" category

## SERVICES (4 cards — map each to its image file)
1. **Deck Building, Rebuild & Expansion** → `deck-build.jpg`
2. **General Handyman Repairs** → `svc-home.jpg`
3. **Painting & Trim** → `painting-interior.jpg`
4. **Drywall Repair** → `drywall-repair.jpg`

## GALLERY (4 DIFFERENT work photos — none may repeat a service/about image)
Use: `deck-stained.jpg`, `work-wall2.jpg`, `handyman-tools.jpg`, `work-sod.jpg`. Captions like "Deck build", "Interior work", "Painting & trim", "Drywall".

## REVIEWS (real verbatim Facebook group quotes — authors are unverifiable, so present them as neighborhood recommendations WITHOUT fake names)
1. "Scott Handiworks is your man!!! Check out his page to see his work. He is an incredible carpenter." — Facebook recommendation (Anderson SC)
2. "GREAT job!!" — Facebook (deck rebuild post)
3. "Scott Handiworks is the one you want." — Facebook recommendation (Easley SC)
Label the section "What neighbors say" — do NOT invent star ratings or reviewer names.

## ABOUT
- **About image:** `about.jpg` (a photo, NOT a logo)
- **H2:** "Built Right. Every Time."
- **P1:** "Scott Handiworks is Matthew Scott, a Liberty-based carpenter and deck builder serving the Upstate. From brand-new decks to small fixes to full home improvements, he does quality work at fair rates — with free quotes and great communication."
- **P2:** "Need a deck rebuilt or a new one built from scratch? A repair, some painting, or drywall? Scott Handiworks is the one to call."

## BRANDING / COLORS (no brand found — use a clearly-swappable neutral placeholder, DO NOT guess a brand)
Replace the template's green/navy with a **neutral navy + warm amber** placeholder:
- accent (primary): `#D98A2B` (amber)
- accent-light: `#E8A85C`
- brand (dark section bg): `#1B3C53` (navy)
- brand-dark: `#0F2438`
- Keep white text on the dark navy. NO lavender/pink/purple. NO Local Launch teal. (This palette is a placeholder — flag it as swappable in your report.)

## HERO
- **Hero video:** `hero.mp4` + `hero-poster.jpg` (keep full-bleed `object-fit: cover`)
- **Headline:** "Decks & Handyman Work, Done Right"
- **Sub:** "Deck building, repairs, painting & drywall across Liberty, Clemson, Easley and the Upstate."
- **Badge:** "Free Quotes · Liberty, SC"

## CONSTRAINTS (HARD)
- Remove ALL Kevin Pang / Simpsonville / 864-918-5096 / "Upstate Handyman and Landscaping" text. Grep `Kevin`, `Pang`, `Simpsonville`, `918` → ZERO.
- `svc-pw.jpg` was removed (no pressure-washing service) — do NOT reference it.
- No fabricated facts. Reviews above verbatim only; do NOT invent authors/ratings.
- Keep mobile responsive.

## DEPLOY
- `PROJECT = "scott-handiworks-demo"` (already set in deploy.py — do not change).

## HARD RULES (apply ALL — hard-won from Zach rejection rounds, DO NOT omit)
0. WORK FROM THE GRAFT GRAPH — this is an in-dir rebrand, so you may edit index.html directly; graft=0 is expected/fine.
0a. CLIENT BRAND COLORS — no brand found, so use the neutral navy/amber placeholder above (swappable). NEVER /hallmark lavender/pink (#E85C9B/#F2A0C6/#6B4FA8/#9B7ED8) or Local Launch teal/slate.
1. VISUALIZER — handyman is NOT a transform trade; no before/after slider required (mark visualizer=N/A).
2. REAL HD BACKGROUND IMAGES on hero/services/about. NO plain solid-color cards/sections. Every service card = HD trade image + dark scrim.
3. PREMIUM DEPTH CARDS — light/frosted cards elevated off a dark section: rgba(255,255,255,0.92), backdrop-blur, soft shadow, rounded 18-22px, dark titles + gradient icon badges. Copy the gold-standard B&M demo pattern (graft grep it).
4. QUALITY — hero video autoplay muted loop playsinline + poster, award-quality, NO clearly-AI imagery, NO "2010-era" plain look.
5. EVERY image distinct — services=4 unique, gallery=4 DIFFERENT unique, about=own. No reuse across sections.
6. NO SVG, NO fake data. Real phone/owner/reviews (above) or honest placeholder. Trade-specific hero.
7. Poster = the video's exact first frame.
QA before done — the 8.5 VISUAL GATE (quality-over-speed), all three in order:
  (a) redundancy: `/home/zach/hermes-agent/venv/bin/python3 /mnt/d/LocalLaunch/tools/check_redundancy.py <this_dir>` (system python false-passes);
  (b) dual-viewport visual check 1280 + 390 (Gemini): no overlap, no hidden-behind-scrim, no cut CTAs, every card = real distinct trade image, no broken/404;
  (c) fresh-context blind critic at 8.5/10 Diaz bar.

SELF-CERTIFY at the end (exact line):
"SELF-CERTIFY: graft-used=YES/NO, visualizer=N/A (handyman), HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=NO (placeholder navy/amber), checked-1280&390=YES."

## OUTPUT
Report: name/phone/city swaps confirmed, leftover Kevin/Pang/Simpsonville/918 count (must be 0), PROJECT name, SELF-CERTIFY line.
