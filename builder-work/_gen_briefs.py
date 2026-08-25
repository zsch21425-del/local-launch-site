#!/usr/bin/env python3
"""Generate BRIEF.md + copy canonical template for each of the 19 demo leads."""
import os, shutil, re, json

ROOT = '/mnt/d/LocalLaunch'
TM = ROOT + '/templates'
BW = ROOT + '/builder-work'

HARD_RULES = """HARD RULES (apply ALL — these were hard-won from many Zach rejection rounds, DO NOT omit any):
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
SELF-CERTIFY at the end, IN YOUR TERMINAL REPORT ONLY (do NOT write the checklist into index.html as HTML/CSS comments — that leaks old-client strings and trips the grep leak-check): "graft-used=YES/NO, visualizer=YES/NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES/NO, rgba-recolored=YES, services-bg-full=YES, scrims-dark=YES/NO, checked-1280&390=YES"."""

# slug, name, phone(display), city, trade, template, owner, services(list), tagline, visualizer(bool)
LEADS = [
 dict(slug="mmk-pressure-washing", name="MM&K Pressure Washing", phone="(864) 940-3308", city="Anderson, SC",
      trade="pressure washing", template="pressure-washing", owner="TBD",
      services=["House Washing","Driveway & Concrete Cleaning","Soft Washing","Roof Cleaning"],
      tagline="Anderson's soft-wash & exterior cleaning pros", visualizer=True),
 dict(slug="sky-branch-llc", name="Sky Branch LLC", phone="(864) 621-0858", city="Greer, SC",
      trade="gutter cleaning & window replacement", template="gutter-cleaning", owner="TBD",
      services=["Gutter Cleaning","Gutter Repair","Window Replacement","Downspout Service"],
      tagline="Greer's gutter & window experts", visualizer=False),
 dict(slug="gulottas-window-cleaning", name="Gulotta's Window Cleaning", phone="(864) 934-9526", city="Greenville, SC",
      trade="window cleaning, pressure washing, gutters", template="pressure-washing", owner="Jeff & Cathy Gulotta",
      services=["Window Cleaning","Pressure Washing","Gutter Cleaning","Screen Cleaning"],
      tagline="Greenville's trusted window & exterior cleaning", visualizer=True),
 dict(slug="tree-wisemen-upstate", name="Tree Wisemen Upstate", phone="(415) 850-7584", city="Easley, SC",
      trade="tree service", template="tree-service", owner="TBD",
      services=["Tree Removal","Tree Trimming & Pruning","Stump Grinding","Emergency Storm Cleanup"],
      tagline="Easley's tree care professionals", visualizer=False),
 dict(slug="lumberjack-tree-service", name="Lumberjack Tree Service", phone="(864) 642-7705", city="Anderson, SC",
      trade="tree service", template="tree-service", owner="Chris McCollum",
      services=["Tree Removal","Tree Trimming","Storm Cleanup","24/7 Emergency"],
      tagline="Anderson's 24/7 tree service", visualizer=False),
 dict(slug="brb-pressure-washing", name="BRB Pressure Washing Service", phone="(864) 630-3757", city="Simpsonville / Greenville, SC",
      trade="pressure washing", template="pressure-washing", owner="Charles A. Belin",
      services=["House Washing","Driveway Cleaning","Deck & Fence Washing","Soft Washing"],
      tagline="Simpsonville's pressure washing pros", visualizer=True),
 dict(slug="upstate-window-cleaning", name="Upstate Window Cleaning LLC", phone="(864) 398-0766", city="Inman, SC",
      trade="window & gutter cleaning", template="pressure-washing", owner="TBD",
      services=["Window Cleaning","Gutter Cleaning","Screen Repair","Pressure Washing"],
      tagline="Inman's window & gutter specialists", visualizer=True),
 dict(slug="fix-home-projects", name="FIX Home Projects LLC", phone="(864) 918-4947", city="Greenville, SC",
      trade="custom decks, porches & handyman", template="handyman", owner="TBD",
      services=["Custom Decks","Porches","Handyman Repairs","Outdoor Living"],
      tagline="Custom decks & home projects, Greenville", visualizer=False),
 dict(slug="brian-dillard-concrete", name="Brian Dillard Concrete LLC", phone="(864) 606-2818", city="Roebuck, SC",
      trade="concrete contractor", template="concrete", owner="Brian Dillard",
      services=["Driveways","Patios","Foundations","Stamped Concrete"],
      tagline="Roebuck concrete done right", visualizer=True),
 dict(slug="cleaning-angels", name="Cleaning Angels", phone="(864) 404-9955", city="Fountain Inn, SC",
      trade="house cleaning", template="cleaning", owner="Erica Wilson",
      services=["Standard Cleaning","Deep Cleaning","Move-In/Out Cleaning","Recurring Service"],
      tagline="Fountain Inn's trusted cleaning service", visualizer=False),
 dict(slug="gotta-guy-home-services", name="Gotta Guy Home Services", phone="(864) 430-7248", city="Simpsonville / Fountain Inn, SC",
      trade="handyman", template="handyman", owner="TBD",
      services=["Deck Repair","Door Installation","Flooring","Light Fixtures & Gutters"],
      tagline="Your go-to guy for home services", visualizer=False),
 dict(slug="home-shield-roofing", name="Home Shield Roofing", phone="(864) 209-6219", city="Anderson, SC",
      trade="residential roofing", template="roofing", owner="TBD",
      services=["Roof Repair","Roof Replacement","Leak Repair","Inspections"],
      tagline="Anderson's roofing shield", visualizer=False),
 dict(slug="milford-mountain-landscape", name="Milford Mountain Landscape", phone="(864) 416-1596", city="Greer, SC",
      trade="landscaping", template="lawncare", owner="TBD",
      services=["Landscape Design","Planting","Mulching","Stone Work & Window Boxes"],
      tagline="Greer landscape design & care", visualizer=False),
 dict(slug="sbc-handyman-services", name="SBC Handyman Services", phone="(864) 920-9626", city="Greenville, SC",
      trade="handyman", template="handyman", owner="TBD",
      services=["Appliance Repair","Drywall","Light Fixtures","Home Repairs"],
      tagline="Greenville handyman you can count on", visualizer=False),
 dict(slug="kanebreak-custom-backyards", name="Kanebreak Custom Backyards", phone="(864) 884-4605", city="Greenville / Simpsonville, SC",
      trade="decks, fencing & outdoor living", template="handyman", owner="TBD",
      services=["Custom Decks","Fencing","Patios","Outdoor Living"],
      tagline="Custom backyards, built to last", visualizer=False),
 dict(slug="wright-time-disposal", name="Wright Time Disposal Service", phone="(864) 376-1200", city="Pelzer, SC",
      trade="junk removal", template="junk-removal", owner="TBD",
      services=["Junk Removal","Debris Hauling","Appliance Removal","Cleanouts"],
      tagline="Pelzer junk removal, right on time", visualizer=True),
 dict(slug="all-in-one-maintenance", name="All In One Maintenance", phone="(864) 658-7960", city="Pelzer, SC",
      trade="junk removal / lawn / handyman", template="junk-removal", owner="TBD",
      services=["Junk Removal","Grass Cutting","Handyman Repairs","Hauling"],
      tagline="One call for junk, lawn & repairs", visualizer=True),
 dict(slug="fresh-blades-lawn-care", name="Fresh Blades Lawn Care", phone="(864) 304-5845", city="Lyman, SC",
      trade="lawn care", template="lawncare", owner="TBD",
      services=["Lawn Mowing","Edging","Leaf Cleanup","Lawn Maintenance"],
      tagline="Lyman lawn care, fresh every time", visualizer=False),
 dict(slug="fresh-start-pressure-washing", name="Fresh Start Pressure Washing", phone="(864) 633-7810", city="Clemson, SC",
      trade="pressure washing", template="pressure-washing", owner="TBD",
      services=["House Washing","Driveway Cleaning","Soft Washing","Deck Washing"],
      tagline="Clemson pressure washing, fresh start", visualizer=True),
]

def tel(phone):
    d = re.sub(r'\D', '', phone)
    if d.startswith('1') and len(d) == 11:
        d = d[1:]
    return '+1' + d

os.makedirs(BW, exist_ok=True)
made = []
for L in LEADS:
    slug = L['slug']; tmpl = f"{TM}/{L['template']}"
    dest = f"{BW}/{slug}"
    if not os.path.isdir(tmpl):
        print(f"SKIP {slug}: no template {tmpl}"); continue
    if not os.path.isdir(dest):
        shutil.copytree(tmpl, dest)
    else:
        print(f"EXISTS {slug} (left in place)")
    t = tel(L['phone'])
    svc = ', '.join(L['services'])
    vis = "YES — this trade REQUIRES a before/after visualizer slider. Include it." if L['visualizer'] else "NO — not a transform trade, no visualizer needed."
    brief = f"""# BRIEF — {L['name']} ({L['trade']})

## Client facts (REAL, verified)
- Business: {L['name']}
- Phone: {L['phone']} — tel: href MUST be `{t}` (E.164, 12 chars, NO double-1)
- City / service area: {L['city']}
- Owner: {L['owner']}
- Services (use EXACTLY these): {svc}
- Tagline direction: "{L['tagline']}" (keep it human, no AI-speak)
- Brand colors: NOT researched yet — check their Facebook/logo/socials via the web; if none found, use a tasteful dark + accent placeholder and note it as swappable. NEVER use Local Launch teal/slate (#21A9A8/#2D3338).
- Visualizer: {vis}

## Build instructions
- Fork the `{L['template']}` template ALREADY COPIED into this directory (index.html + assets). Do NOT redesign sections — rebrand only.
- Change ONLY: brand name, phone (+ tel: href), city/service-area copy, services list, reviews (verbatim only — use real quotes if available, else honest proof points like "years in business" / "recommended on Nextdoor"; NEVER a made-up star count), images, logo/icon, colors, meta/og tags.
- REMOVE every leftover string from the template's previous client (name, phone, city, owner) — grep and clear them all.
- Keep: the premium structure, video hero, section layout, and all design treatment.

## Verification (before you report done)
- `tel:` href must regex-match `^\\+1\\d{{10}}$` exactly (12 chars).
- Enumerate every `src`/`poster`/`url()` and confirm each media file exists in this dir (no broken refs).
- Grep for the template's previous-client name/phone/city — must return ZERO.
- No CSS syntax errors; no leftover `{{PLACEHOLDER}}` tokens.

{HARD_RULES}

SELF-CERTIFY (terminal report only, one line): graft-used=YES/NO, visualizer=YES/NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES/NO, rgba-recolored=YES, services-bg-full=YES, scrims-dark=YES/NO, checked-1280&390=YES.
"""
    with open(f"{dest}/BRIEF.md", 'w') as f:
        f.write(brief)
    made.append(slug)
    print(f"OK {slug} -> {dest}")

print(f"\nDONE: {len(made)}/{len(LEADS)} briefs written")
