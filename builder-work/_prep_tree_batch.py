#!/usr/bin/env python3
import re, os

BASE = '/mnt/d/LocalLaunch/builder-work'

LEADS = {
  'robertsons-tree-service': dict(
    name='Robertsons Tree Service', city='Travelers Rest', phone='(864) 834-1854',
    digits='18648341854', email='treesrg@bellsouth.net', slug='robertsons-tree-demo',
    services=['Tree Removal', 'Tree Trimming', 'Stump Grinding', 'Storm Cleanup']),
  'sasquatch-tree-services': dict(
    name='Sasquatch Tree Services LLC', city='Spartanburg', phone='(864) 497-8082',
    digits='18644978082', email='sasquatchtreeservices@gmail.com', slug='sasquatch-tree-services-demo',
    services=['Hazardous Removal', 'Spikeless Pruning', 'Storm Damage', 'Stump Grinding']),
  'rig-line-tree-service': dict(
    name='Rig Line Tree Service', city='Westminster', phone='(864) 247-9107',
    digits='18642479107', email='Riglinetreeservice@yahoo.com', slug='rig-line-tree-demo',
    services=['Tree Removal', 'Tree Thinning', 'Tree Pruning', 'Stump Grinding']),
  'montes-tree-service': dict(
    name="Monte's Tree Service", city='Easley', phone='(864) 430-0010',
    digits='18644300010', email='montestreeservice579@gmail.com', slug='montes-tree-demo',
    services=['Tree Removal', 'Tree Trimming', 'Stump Grinding', 'Lot Clearing']),
}

HARD = """## HARD RULES + SELF-CERTIFY (non-negotiable)
- NO fabricated reviews, star counts, review counts, or quotes. NO invented metrics. This is a HARD FAIL.
- Premium structure MUST stay intact: video hero, scrolling trust marquee, sticky HD background + frosted-glass service cards, gallery, dark palette. Do NOT flatten to solid/plain cards.
- Keep real HD background imagery on every section (no plain-color sections).
- 4 gallery images (work-a..d.jpg) are ALREADY distinct — keep them, do NOT regenerate or swap.
- Hero video + poster stay as-is (poster = first frame of the video).
- Do NOT touch anything outside this directory.
- End your report with a SELF-CERTIFY line: name, phone, and city are correct; 0 leftover template strings; no fabricated reviews; premium structure intact; images distinct."""

for dirname, L in LEADS.items():
    d = os.path.join(BASE, dirname)
    # 1. patch deploy.py PROJECT
    dp = os.path.join(d, 'deploy.py')
    s = open(dp).read()
    s = re.sub(r'PROJECT\s*=\s*"[^"]*"', f'PROJECT = "{L["slug"]}"', s)
    open(dp, 'w').write(s)
    # 2. remove stale BRIEF.md + TEMPLATE-BRIEF.md from the fork
    for f in ['BRIEF.md', 'TEMPLATE-BRIEF.md']:
        p = os.path.join(d, f)
        if os.path.exists(p): os.remove(p)
    # 3. write new BRIEF.md
    services_md = '\n'.join(f'- {x}' for x in L['services'])
    marquee = ' · '.join(L['services'][:3])
    brief = f"""# Builder Task — {L['name']} (tree-service premium rebrand)

You are in `{d}`. This is a fork of the CANONICAL tree-service premium template (OKLCH + video hero + trust marquee + sticky HD bg + frosted-glass cards + gallery + testimonials + service area + contact + Local Launch footer). Rebrand it into **{L['name']}**, a tree service in {L['city']}, SC.

## REAL FACTS (verified)
- Business: {L['name']}
- City: {L['city']}, SC (serve "{L['city']} & the Upstate")
- Phone: {L['phone']} · tel:+1{L['digits']}
- Email: {L['email']}
- Services: {L['services'][0]}, {L['services'][1]}, {L['services'][2]}, {L['services'][3]}

## COLORS — keep the template's red accent (do NOT recolor)
Keep the existing OKLCH palette exactly (dark charcoal + red accent). Only change the text content below.

## WHAT TO CHANGE
1. Replace ALL "Lumberjack Tree Service" → "{L['name']}"
2. Remove owner name "Christopher McCollum" → use generic "our crew" / no named owner
3. Replace phone "864-642-7705" → "{L['phone']}" (display text AND every tel: link)
4. City/area: "Anderson, SC" → "{L['city']}, SC" (and any other area mentions)
5. Services (4 cards), match text + keep tree icons:
{services_md}
6. Trust marquee → ONLY verified items (replace "12 Years · 24/7 Emergency · Free Estimates · Veteran & Senior Discounts · Residential & Commercial"): use "{marquee}" and "Serving {L['city']} & the Upstate". REMOVE all unverified claims ("12 Years", "24/7 Emergency", "Free Estimates", "Veteran & Senior Discounts", "licensed & insured").
7. REVIEWS — NO verified review count or verbatim quotes exist for this business. REPLACE the testimonial/review section, the "Ken Lovingood" quote, and the "Google 5.0★ (5 reviews)" / "Facebook 100% recommend (13 reviews)" stats with an HONEST line: "Trusted by homeowners across {L['city']} & the Upstate." Do NOT fabricate any star count, review count, or quote.
8. Hero headline/tagline: keep "Tree Service You Can Trust" (or adapt minimally). No fabricated claims.

## MEDIA (already staged — do NOT regenerate)
- hero.mp4 / hero.webm / hero-poster.jpg = tree work video (KEEP as-is)
- services-bg.jpg = wood chips background (KEEP)
- work-a..d.jpg = 4 distinct gallery images (KEEP)

## REMOVE — grep to ZERO before finishing
"Lumberjack", "Christopher", "McCollum", "864-642-7705", "Ken Lovingood", "12 Years", "24/7", "licensed & insured", "Anderson"

{HARD}
"""
    open(os.path.join(d, 'BRIEF.md'), 'w').write(brief)
    print(f"OK {dirname}: deploy={L['slug']}, brief written ({len(brief)} chars)")
print("DONE")
