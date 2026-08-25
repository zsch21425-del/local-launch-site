#!/usr/bin/env python3
"""Save freshly-approved demos as canonical templates (overwrite gappy bases)."""
import os, shutil

BASE = '/mnt/d/LocalLaunch/builder-work'
TPL = '/mnt/d/LocalLaunch/templates'

SAVES = {
  # trade -> source demo dir
  'painting':  'leos-pro-line-painting',
  'concrete':  'gray-wolf-concrete',
  'cleaning':  'marshall-cleaning',
  'handyman':  'joshua-truitt-handyman',
}

TEMPLATE_BRIEFS = {
 'painting': """# Canonical Template — Painting (interior/exterior) + before/after visualizer

Source: Leo's Pro Line Painting (approved 2026-08-23). Premium OKLCH: video hero + trust marquee + sticky HD bg + frosted-glass cards + **before/after visualizer (before.jpg/after.jpg — SAME room pair)** + gallery (work-a..d) + testimonials + service area + contact + Local Launch footer.

## Rebrand steps (change ONLY these)
- Business name + owner name (remove any named owner → "our crew")
- Phone (display + `tel:+1` + 10-digit E.164 — NEVER a leading duplicate "1")
- City / service area ("Fort Wayne/Indiana" → new city + "the Upstate")
- 4 service cards (Interior, Exterior, Drywall, Cabinet/Vanity)
- Reviews: use VERIFIED count only if known (e.g. "5.0★ · 16 reviews"); else "Trusted by homeowners across {city} & the Upstate"
- **Regenerate before.jpg + after.jpg as a SAME-SCENE pair** (generate AFTER first, then image-to-image → BEFORE with the same room/layout). Critic REJECTS a before/after that is two different rooms.
- Regenerate work-a..d.jpg (4 distinct gallery scenes)

## Leak strings to grep → ZERO
"Garcia", "Fort Wayne", "Indiana", "260-600-8628", "2606008628"

## HARD RULES
No fabricated reviews. Keep premium structure (video hero, visualizer, glass cards). Keep real HD imagery on every section. Verify every media ref = HTTP 200. tel byte-verify. SELF-CERTIFY in terminal only.
""",
 'concrete': """# Canonical Template — Concrete (driveways/patios/repair) + grading

Source: Gray Wolf Concrete & Construction (approved 2026-08-23). Premium OKLCH: video hero + trust marquee + gallery (work-driveway/patio/repair/grading) + testimonials + service area + contact + Local Launch footer.

## Paver-sealing VARIANT (Spartan Paver Sealing, approved 2026-08-23)
For a paver/concrete SEALING lead (not pouring): change the 4 service cards to sealing language (Paver Sealing, Driveway Sealing, Patio Sealing, Paver Cleaning & Restoration), regenerate the 4 gallery images as SEALED-paver scenes, and swap the hero video for a sealing scene (roller applying glossy sealant, wet-look sheen). Reference demo: `builder-work/spartan-paver-sealing/`.

## Rebrand steps (change ONLY these)
- Business name + owner (Brian Dillard → new; may use "owner-operated" if real)
- Phone (display + `tel:+1` + 10-digit E.164, no duplicate "1")
- City ("Roebuck" → new city + "the Upstate")
- 4 service cards (Driveways, Patios, Sidewalk/Repair, Grading)
- Reviews: no fabricated count → "Trusted by homeowners across {city} & the Upstate"
- Regenerate work-driveway/patio/repair/grading.jpg (4 distinct)

## Leak strings → ZERO
"Brian Dillard", "Roebuck", "Neighborhood Favorite"

## HARD RULES
No fabricated reviews. Premium structure intact. HD imagery everywhere. Media HTTP 200. tel byte-verify. SELF-CERTIFY terminal only.
""",
 'cleaning': """# Canonical Template — Cleaning (residential/commercial)

Source: Marshall Cleaning (approved 2026-08-23). Premium OKLCH: video hero + trust marquee + sticky HD bg + frosted-glass cards + gallery (work-a..d) + testimonials + contact + Local Launch footer.

## Rebrand steps (change ONLY these)
- Business name + owner ("Cleaning Angels" / "Erica"/"grayson" → new; no named owner)
- Phone (display + `tel:+1` + 10-digit E.164, no duplicate "1")
- City ("Fountain Inn" → new city + "the Upstate")
- Tagline ("Moms Who Get It." → a cleaning tagline, no fabricated claims)
- 6 service cards (Deep, Recurring, Move-In/Move-Out, Basic Clean, Floors/Bathrooms, Organization)
- Reviews: no fabricated count → "Trusted by homeowners across {city} & the Upstate"
- Regenerate work-a..d.jpg (4 distinct clean-home scenes)

## Leak strings → ZERO
"Cleaning Angels", "Erica", "grayson", "Fountain Inn", "Moms Who Get It", "864-404-9955"

## HARD RULES
No fabricated reviews. Premium structure intact. HD imagery everywhere. Media HTTP 200. tel byte-verify. SELF-CERTIFY terminal only.
""",
 'handyman': """# Canonical Template — Handyman (pure, NOT mixed)

Source: Joshua Truitt Handyman (approved 2026-08-23). This REPLACES the old mixed-trade template (handyman + landscaping + pressure washing). Premium OKLCH: video hero + trust marquee + sticky HD bg + frosted-glass cards + gallery (work-a..d) + testimonials + contact + Local Launch footer.

## Rebrand steps (change ONLY these)
- Business name ("Upstate Handyman and Landscaping" → new)
- Phone (display + `tel:+1` + 10-digit E.164, no duplicate "1"). NOTE: "(503) 358-5860" in the footer is the Local Launch agency contact — LEAVE IT.
- City ("Simpsonville" → new city + "the Upstate")
- 4 service cards → handyman services (REPLACE "Landscaping"/"Pressure Washing" — they are NOT part of a pure handyman business)
- Reviews: no fabricated count → "Trusted by homeowners across {city} & the Upstate"
- Regenerate work-a..d.jpg (4 distinct handyman scenes)
- services-bg.jpg / reviews-bg.jpg are background images (KEEP or regenerate to match the trade)

## Leak strings → ZERO
"Upstate Handyman", "Landscaping", "Pressure Washing", "864-918-5096", "20+ Years", "local-launch-site.vercel.app"

## HARD RULES
No fabricated reviews. Premium structure intact. HD imagery everywhere. Media HTTP 200. tel byte-verify. SELF-CERTIFY terminal only.
""",
}

for trade, src in SAVES.items():
    src_dir = os.path.join(BASE, src)
    dst_dir = os.path.join(TPL, trade)
    if not os.path.isdir(src_dir):
        print(f"SKIP {trade}: no source {src}"); continue
    # overwrite template with the approved demo
    if os.path.exists(dst_dir):
        shutil.rmtree(dst_dir)
    shutil.copytree(src_dir, dst_dir)
    # drop the client build brief (keep only TEMPLATE-BRIEF.md)
    for f in ['BRIEF.md', 'README.md', 'TEMPLATE-BRIEF.md']:
        p = os.path.join(dst_dir, f)
        if os.path.exists(p): os.remove(p)
    open(os.path.join(dst_dir, 'TEMPLATE-BRIEF.md'), 'w').write(TEMPLATE_BRIEFS[trade])
    # count files
    n = len(os.listdir(dst_dir))
    print(f"SAVED {trade} <- {src} ({n} files)")

print("DONE")
