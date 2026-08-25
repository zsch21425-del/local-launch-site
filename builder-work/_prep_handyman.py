#!/usr/bin/env python3
"""Prep handyman batch (Joshua Truitt + Kirk Johnson + PVP). Mixed template -> pure handyman."""
import os, json, base64, io, re, shutil, urllib.request
from PIL import Image

BASE = '/mnt/d/LocalLaunch/builder-work'
TPL = '/mnt/d/LocalLaunch/templates/handyman'

key = None
for line in open('/home/zach/.hermes/.env'):
    if line.strip().startswith('GEMINI_API_KEY='):
        key = line.strip().split('=', 1)[1].strip(); break

def gen(prompt, out, aspect='4:3', max_w=1400, q=82):
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=120).read())
    except Exception as e:
        return f"ERR {e}"
    for p in data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
        if 'inlineData' in p:
            b = base64.b64decode(p['inlineData']['data'])
            img = Image.open(io.BytesIO(b)).convert('RGB')
            img.thumbnail((max_w, max_w), Image.LANCZOS)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            img.save(out, 'JPEG', quality=q, optimize=True)
            return f"ok {os.path.getsize(out)//1024}KB"
    return "no image"

P = "Professional photorealistic photograph of {}, natural lighting, no people (or only hands/tools visible), no text, no watermark, sharp detail, residential South Carolina home."

LEADS = {
  'joshua-truitt-handyman': dict(
    name='Joshua Truitt Handyman', city='Fountain Inn', phone='(864) 601-0891',
    digits='18646010891', email='joshuatruitt602@gmail.com', slug='joshua-truitt-handyman-demo',
    services=['Door Replacement', 'Gutter Service', 'Drywall Repair', 'General Home Repairs'],
    images=[
      ('work-a.jpg', 'a handyman installing a new interior door in a home hallway with tools'),
      ('work-b.jpg', 'a handyman on a ladder cleaning and repairing a gutter along a house roofline'),
      ('work-c.jpg', 'a handyman patching and smoothing drywall on an interior wall with a trowel'),
      ('work-d.jpg', 'a handyman fixing a kitchen cabinet hinge with a screwdriver'),
    ]),
  'kirk-johnson-handyman': dict(
    name='Kirk Johnson Handyman Contractor', city='Easley', phone='(941) 626-6146',
    digits='19416266146', email='kirk12johnson@gmail.com', slug='kirk-johnson-handyman-demo',
    services=['Electrical & Lighting', 'Plumbing Repairs', 'Deck & Walkway', 'General Repairs'],
    images=[
      ('work-a.jpg', 'a handyman installing a modern ceiling light fixture with a screwdriver'),
      ('work-b.jpg', 'a handyman repairing a sink drain under a kitchen cabinet with a wrench'),
      ('work-c.jpg', 'a partially built wooden deck with tools and lumber in a backyard'),
      ('work-d.jpg', 'a handyman repairing a roof shingle on a ladder'),
    ]),
  'pvp-home-services': dict(
    name='PVP Home Services LLC', city='Simpsonville', phone='(864) 606-9777',
    digits='18646069777', email='pvphomeservices@gmail.com', slug='pvp-home-services-demo',
    services=['TV Mounting', 'Ceiling Fans', 'Wall Repair', 'Water-Damage Repairs'],
    images=[
      ('work-a.jpg', 'a flat-screen TV mounted on a living room wall with a drill and level nearby'),
      ('work-b.jpg', 'a handyman installing a ceiling fan in a bedroom'),
      ('work-c.jpg', 'a handyman repairing and repainting a patched wall section'),
      ('work-d.jpg', 'a handyman repairing a water-damaged drywall section with new drywall panel'),
    ]),
}

HARD = """## HARD RULES + SELF-CERTIFY (non-negotiable)
- NO fabricated reviews, star counts, review counts, or quotes.
- Premium structure MUST stay intact: video hero, trust marquee, sticky HD background + frosted-glass cards, gallery, dark palette. Do NOT flatten to solid/plain cards.
- Keep real HD background imagery on every section (no plain-color sections).
- 4 gallery images (work-a..d.jpg) are ALREADY distinct — keep them, do NOT regenerate or swap.
- Hero video + poster stay as-is.
- Do NOT touch anything outside this directory.
- End your report with a SELF-CERTIFY line: name, phone, and city are correct; 0 leftover template strings; no fabricated reviews; premium structure intact; images distinct."""

for dirname, L in LEADS.items():
    d = os.path.join(BASE, dirname)
    if os.path.exists(d): shutil.rmtree(d)
    shutil.copytree(TPL, d)
    for f in ['BRIEF.md', 'TEMPLATE-BRIEF.md', 'README.md']:
        p = os.path.join(d, f)
        if os.path.exists(p): os.remove(p)
    for fn, pr in L['images']:
        print(f"{dirname}/{fn}:", gen(P.format(pr), os.path.join(d, fn)))
    dp = os.path.join(d, 'deploy.py')
    s = open(dp).read()
    s = re.sub(r'PROJECT\s*=\s*"[^"]*"', f'PROJECT = "{L["slug"]}"', s)
    open(dp, 'w').write(s)
    services_md = '\n'.join(f'- {x}' for x in L['services'])
    brief = f"""# Builder Task — {L['name']} (handyman premium rebrand)

You are in `{d}`. Fork of the handyman premium template. Rebrand into **{L['name']}**, a handyman service in {L['city']}, SC.

## REAL FACTS (verified)
- Business: {L['name']}
- City: {L['city']}, SC (serve "{L['city']} & the Upstate")
- Phone: {L['phone']} · tel:+1{L['digits']}
- Email: {L['email']}
- Services (REPLACE the template's 4 cards with these — the template currently lists Landscaping + Pressure Washing, which this business does NOT do):
{services_md}

## WHAT TO CHANGE
1. Replace ALL "Upstate Handyman and Landscaping" → "{L['name']}"
2. Phone: "(864) 918-5096" → "{L['phone']}" (display AND tel: links). NOTE: the footer's "(503) 358-5860" is the Local Launch agency contact — LEAVE IT as-is (it is the "hire us" pitch, not the client).
3. City/area: "Simpsonville" → "{L['city']}" (and any area mentions)
4. Services (4 cards) → the handyman services listed above. REMOVE "Landscaping" and "Pressure Washing" entirely.
5. Gallery images: use work-a..d.jpg (4 NEW distinct handyman images — already staged). Replace the old work-sod.jpg / work-wall2.jpg / svc-pw.jpg references with the new work-a..d.jpg. svc-home.jpg may stay if it fits, but do NOT use the landscaping (work-sod) or pressure-washing (svc-pw) images.
6. Fix footer links: replace any "local-launch-site.vercel.app" → "https://locallaunchupstate.com".
7. REMOVE "20+ Years" and any unverified "years of experience" claim → honest wording only.
8. Reviews: NO verified review count. Replace with "Trusted by homeowners across {L['city']} & the Upstate." Do NOT fabricate.
9. Remove any owner name → "our crew" / no named owner.

## MEDIA (already staged — do NOT regenerate)
- work-a..d.jpg = 4 NEW distinct handyman gallery images (KEEP)
- hero.mp4 / hero-poster.jpg / hero-still.jpg / about.jpg / logo-bg.jpg = KEEP

## REMOVE — grep to ZERO before finishing
"Upstate Handyman", "Landscaping", "Pressure Washing", "864-918-5096", "20+ Years", "20+ years", "local-launch-site.vercel.app"

{HARD}
"""
    open(os.path.join(d, 'BRIEF.md'), 'w').write(brief)
    print(f"OK {dirname}: deploy={L['slug']}")

print("DONE")
