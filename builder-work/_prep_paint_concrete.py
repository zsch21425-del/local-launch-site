#!/usr/bin/env python3
"""Prep painting (Leo's, before/after visualizer) + concrete (Gray Wolf, Spartan Paver) demos."""
import os, json, base64, io, re, shutil, urllib.request
from PIL import Image

BASE = '/mnt/d/LocalLaunch/builder-work'
TPLDIR = '/mnt/d/LocalLaunch/templates'

key = None
for line in open('/home/zach/.hermes/.env'):
    if line.strip().startswith('GEMINI_API_KEY='):
        key = line.strip().split('=', 1)[1].strip(); break

def _save(b64, out, max_w=1400, q=82):
    img = Image.open(io.BytesIO(base64.b64decode(b64))).convert('RGB')
    img.thumbnail((max_w, max_w), Image.LANCZOS)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, 'JPEG', quality=q, optimize=True)
    return f"ok {os.path.getsize(out)//1024}KB"

def gen(prompt, out, aspect='4:3', ref=None):
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
    parts = []
    if ref:
        b = base64.b64encode(open(ref, 'rb').read()).decode()
        parts.append({"inlineData": {"mimeType": "image/jpeg", "data": b}})
    parts.append({"text": prompt})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=120).read())
    except Exception as e:
        return f"ERR {e}"
    for p in data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
        if 'inlineData' in p:
            return _save(p['inlineData']['data'], out)
    return "no image"

P = "Professional photorealistic photograph of {}, natural lighting, no people (or only distant figures), no text, no watermark, sharp detail, residential South Carolina setting."

def fork(tpl, dirname):
    d = os.path.join(BASE, dirname)
    if os.path.exists(d): shutil.rmtree(d)
    shutil.copytree(os.path.join(TPLDIR, tpl), d)
    for f in ['BRIEF.md', 'TEMPLATE-BRIEF.md', 'README.md']:
        p = os.path.join(d, f)
        if os.path.exists(p): os.remove(p)
    return d

def patch_deploy(d, slug):
    dp = os.path.join(d, 'deploy.py')
    s = open(dp).read()
    s = re.sub(r'PROJECT\s*=\s*"[^"]*"', f'PROJECT = "{slug}"', s)
    open(dp, 'w').write(s)

HARD = """## HARD RULES + SELF-CERTIFY (non-negotiable)
- NO fabricated reviews, star counts, review counts, or quotes unless the REAL FACTS section gives you a verified number to use.
- Premium structure MUST stay intact: video hero, trust marquee, sticky HD background + frosted-glass cards, gallery, dark palette, before/after visualizer (if present). Do NOT flatten to solid/plain cards.
- Keep real HD background imagery on every section (no plain-color sections).
- Gallery + before/after images are ALREADY distinct — keep them, do NOT regenerate or swap.
- Hero video + poster stay as-is (poster = first frame of the video).
- Do NOT touch anything outside this directory.
- End your report with a SELF-CERTIFY line: name, phone, and city are correct; 0 leftover template strings; no fabricated reviews; premium structure intact; images distinct."""

# ============ 1. LEO'S PAINTING (g38, 5.0/16 reviews VERIFIED) ============
d = fork('painting', 'leos-pro-line-painting')
# after first, then before via image-to-image (same scene)
print("leos after:", gen(P.format("a freshly painted bright and modern living room with crisp new neutral paint on the walls, clean baseboards, natural window light, styled but uncluttered"), os.path.join(d, 'after.jpg')))
print("leos before:", gen("This is the EXACT same room and angle as the reference image. Re-render it BEFORE painting: old, peeling, cracked and faded paint on the walls, water stains, scuffed and worn, dull and neglected. Keep the same room layout, windows, and furniture placement.", os.path.join(d, 'before.jpg'), ref=os.path.join(d, 'after.jpg')))
for fn, pr in [
    ('work-a.jpg', "an exterior of a two-story house freshly repainted, clean siding and trim, a ladder and paint supplies nearby"),
    ('work-b.jpg', "a painter's hand rolling crisp new paint onto an interior wall with blue painter's tape along the trim"),
    ('work-c.jpg', "freshly painted white kitchen cabinets with new hardware in a renovated kitchen"),
    ('work-d.jpg', "a smooth freshly patched and repainted section of drywall in a hallway, seamless finish"),
]:
    print(f"leos {fn}:", gen(P.format(pr), os.path.join(d, fn)))
patch_deploy(d, 'leos-pro-line-painting-demo')
open(os.path.join(d, 'BRIEF.md'), 'w').write(f"""# Builder Task — Leo's Pro Line Painting LLC (painting premium rebrand)

You are in `{d}`. This is a fork of the CANONICAL painting premium template (OKLCH + video hero + trust marquee + sticky HD bg + frosted-glass cards + BEFORE/AFTER visualizer + gallery + testimonials + service area + contact + Local Launch footer). Rebrand it into **Leo's Pro Line Painting LLC**, a residential painter in Travelers Rest / Easley, SC.

## REAL FACTS (verified)
- Business: Leo's Pro Line Painting LLC
- City: Travelers Rest / Easley, SC (serve "Travelers Rest, Easley & the Upstate")
- Phone: (864) 325-6313 · tel:+18643256313
- Email: Leosproline@gmail.com
- Services: Interior Painting, Exterior Painting, Drywall & Sheetrock Repair, Cabinet & Vanity Painting
- Reviews (VERIFIED, may use): 5.0★ on Google · 16 reviews

## WHAT TO CHANGE
1. Replace ALL "Garcia's Painting Company" → "Leo's Pro Line Painting LLC" (and "Garcia" → "Leo's")
2. Phone: "(260) 600-8628" / "260-600-8628" / "2606008628" → "(864) 325-6313" (display AND tel: links)
3. City/area: "Fort Wayne" / "Indiana" / "Northeast Indiana" → "Travelers Rest" / "Easley" / "the Upstate" (SC)
4. Services text (4 cards) → Interior Painting, Exterior Painting, Drywall & Sheetrock Repair, Cabinet & Vanity Painting
5. Reviews: use the VERIFIED "5.0★ on Google · 16 reviews". Do NOT invent extra review counts, names, or verbatim quotes.
6. Remove any "Owner"/founder name → use "our crew" / no named owner.
7. Hero tagline: keep painting-focused. No fabricated claims.

## MEDIA (already staged — do NOT regenerate)
- before.jpg / after.jpg = the SAME room before/after painting (visualizer pair — KEEP)
- work-a..d.jpg = 4 distinct gallery images (KEEP)
- hero.mp4 / hero.webm / hero-poster.jpg = hero video (KEEP)

## REMOVE — grep to ZERO before finishing
"Garcia", "Fort Wayne", "Indiana", "260-600-8628", "2606008628", "Northeast Indiana"

{HARD}
""")

# ============ 2. GRAY WOLF CONCRETE (g13) ============
d = fork('concrete', 'gray-wolf-concrete')
for fn, pr in [
    ('work-driveway.jpg', "a freshly poured smooth concrete driveway leading to a suburban house, expansion joints, broom finish"),
    ('work-patio.jpg', "a new stamped concrete patio with outdoor furniture in a landscaped backyard"),
    ('work-repair.jpg', "a worker patching and resurfacing a cracked concrete walkway with fresh concrete"),
    ('work-grading.jpg', "grading and excavation equipment preparing a residential lot for a concrete pour"),
]:
    print(f"graywolf {fn}:", gen(P.format(pr), os.path.join(d, fn)))
patch_deploy(d, 'gray-wolf-concrete-demo')
open(os.path.join(d, 'BRIEF.md'), 'w').write(f"""# Builder Task — Gray Wolf Concrete & Construction (concrete premium rebrand)

You are in `{d}`. Fork of the CANONICAL concrete premium template. Rebrand into **Gray Wolf Concrete & Construction**, a concrete contractor in Greer, SC.

## REAL FACTS (verified)
- Business: Gray Wolf Concrete & Construction
- City: Greer, SC (serve "Greer & the Upstate")
- Phone: (864) 906-1914 · tel:+18649061914
- Email: graywolfconcrete@gmail.com
- Services: Concrete Driveways, Concrete Patios, Sidewalk & Concrete Repair, Grading & Excavation
- Owner-operator: Zach Forsman (may mention as "owner-operated", no invented credentials)

## WHAT TO CHANGE
1. Replace ALL "Brian Dillard Concrete LLC" → "Gray Wolf Concrete & Construction"
2. Phone "tel:+186..." (old) → "(864) 906-1914" (display AND tel: links)
3. City/area "Roebuck" → "Greer" (and "the Upstate")
4. Remove "Neighborhood Favorite" or any unverified trust claim → honest wording only
5. Reviews: NO verified review count exists. Replace review/testimonial content with "Trusted by homeowners across Greer & the Upstate." Do NOT fabricate.
6. Remove any "Brian Dillard" owner name → "Zach Forsman, owner" or "our crew".

## MEDIA (already staged — do NOT regenerate)
- work-driveway.jpg / work-patio.jpg / work-repair.jpg / work-grading.jpg = 4 distinct gallery images (KEEP)
- hero.mp4 / hero-poster.jpg = hero (KEEP)

## REMOVE — grep to ZERO before finishing
"Brian Dillard", "Roebuck", "Neighborhood Favorite"

{HARD}
""")

# ============ 3. SPARTAN PAVER SEALING (g20) ============
d = fork('concrete', 'spartan-paver-sealing')
for fn, pr in [
    ('work-driveway.jpg', "a freshly sealed paver driveway with a rich wet-look finish, glossy pavers, suburban house"),
    ('work-patio.jpg', "a paver patio with a fresh protective sealant sheen, clean and vibrant color"),
    ('work-repair.jpg', "paver cleaning and restoration in progress, a worker pressure-washing pavers before sealing"),
    ('work-grading.jpg', "a walkway of interlocking pavers freshly sealed and restored, crisp joints"),
]:
    print(f"spartan {fn}:", gen(P.format(pr), os.path.join(d, fn)))
patch_deploy(d, 'spartan-paver-sealing-demo')
open(os.path.join(d, 'BRIEF.md'), 'w').write(f"""# Builder Task — Spartan Paver Sealing (paver/concrete sealing premium rebrand)

You are in `{d}`. Fork of the CANONICAL concrete premium template. Rebrand into **Spartan Paver Sealing**, a paver & concrete sealing company in Spartanburg, SC.

## REAL FACTS (verified)
- Business: Spartan Paver Sealing
- City: Spartanburg, SC (serve "Spartanburg & the Upstate")
- Phone: (864) 590-5864 · tel:+18645905864
- Email: pdesmond@spartanpaversealing.com
- Services (CHANGE the template's 4 cards to these): Paver Sealing, Driveway Sealing, Patio Sealing, Paver Cleaning & Restoration

## WHAT TO CHANGE
1. Replace ALL "Brian Dillard Concrete LLC" → "Spartan Paver Sealing"
2. Phone (old) → "(864) 590-5864" (display AND tel: links)
3. City/area "Roebuck" → "Spartanburg" (and "the Upstate")
4. Services (4 cards) → Paver Sealing, Driveway Sealing, Patio Sealing, Paver Cleaning & Restoration (these are SEALING services, NOT new concrete pours — adjust the copy to describe sealing/restoring existing pavers & concrete, not pouring new)
5. Remove "Neighborhood Favorite" or any unverified trust claim
6. Reviews: NO verified review count. Replace with "Trusted by homeowners across Spartanburg & the Upstate." Do NOT fabricate.
7. Remove "Brian Dillard" owner name.

## MEDIA (already staged — do NOT regenerate)
- work-driveway.jpg / work-patio.jpg / work-repair.jpg / work-grading.jpg = 4 distinct gallery images (KEEP — they show sealed pavers/concrete)
- hero.mp4 / hero-poster.jpg = hero (KEEP)

## REMOVE — grep to ZERO before finishing
"Brian Dillard", "Roebuck", "Neighborhood Favorite"

{HARD}
""")

print("\nDONE — 3 leads prepped (leos-pro-line-painting, gray-wolf-concrete, spartan-paver-sealing)")
