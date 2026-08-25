#!/usr/bin/env python3
"""Prep cleaning batch (Marshall + Simpsonville Cleaning Authority)."""
import os, json, base64, io, re, shutil, urllib.request
from PIL import Image

BASE = '/mnt/d/LocalLaunch/builder-work'
TPL = '/mnt/d/LocalLaunch/templates/cleaning'

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

P = "Professional photorealistic photograph of {}, natural lighting, no people (or only distant figures), no text, no watermark, sharp detail, bright and clean."

LEADS = {
  'marshall-cleaning': dict(
    name='Marshall Cleaning', city='Simpsonville', phone='(864) 417-9750',
    digits='18644179750', email='MarshallCleanings@gmail.com', slug='marshall-cleaning-demo',
    services=['Deep Cleaning', 'Recurring Cleaning', 'Move-In / Move-Out', 'Commercial Cleaning'],
    images=[
      ('work-a.jpg', 'a spotless freshly cleaned bright living room with vacuum lines in the carpet and polished surfaces'),
      ('work-b.jpg', 'a gleaming clean modern kitchen with shiny countertops and a clean sink'),
      ('work-c.jpg', 'a sparkling clean bathroom with a polished mirror, clean tub and neatly folded towels'),
      ('work-d.jpg', 'a tidy organized home office with a clean desk and dusted shelves'),
    ]),
  'simpsonville-cleaning-authority': dict(
    name='Simpsonville Cleaning Authority', city='Simpsonville', phone='(864) 735-6183',
    digits='18647356183', email='simpsonvillecleaningauthority@gmail.com', slug='simpsonville-cleaning-demo',
    services=['Deep Cleaning', 'Recurring Cleaning', 'Move-In / Move-Out', 'Organization & Decluttering'],
    images=[
      ('work-a.jpg', 'a freshly cleaned bright bedroom with crisp made bed and dusted nightstands'),
      ('work-b.jpg', 'a perfectly organized closet with folded clothes and tidy shelves'),
      ('work-c.jpg', 'a clean bright kitchen with spotless counters and a shiny floor'),
      ('work-d.jpg', 'a decluttered organized garage or shed with labeled bins on shelves'),
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
    brief = f"""# Builder Task — {L['name']} (cleaning premium rebrand)

You are in `{d}`. Fork of the CANONICAL cleaning premium template. Rebrand into **{L['name']}**, a cleaning service in {L['city']}, SC.

## REAL FACTS (verified)
- Business: {L['name']}
- City: {L['city']}, SC (serve "{L['city']} & the Upstate")
- Phone: {L['phone']} · tel:+1{L['digits']}
- Email: {L['email']}
- Services (set the service cards to these):
{services_md}

## WHAT TO CHANGE
1. Replace ALL "Cleaning Angels" → "{L['name']}"
2. Remove owner name "Erica" / "grayson" → no named owner / "our team"
3. Phone (old "(864) 404-9955" / tel:+186…) → "{L['phone']}" (display AND tel: links)
4. City/area "Fountain Inn" → "{L['city']}" (and "the Upstate")
5. Tagline "Moms Who Get It." → a cleaning-focused tagline for {L['name']} (no fabricated claims)
6. Reviews: NO verified review count. Replace with "Trusted by homeowners across {L['city']} & the Upstate." Do NOT fabricate.

## MEDIA (already staged — do NOT regenerate)
- work-a..d.jpg = 4 distinct gallery images (KEEP)
- hero.mp4 / hero.webm / hero-poster.jpg = hero (KEEP)
- services-bg.jpg / services-bg-mob.jpg = KEEP

## REMOVE — grep to ZERO before finishing
"Cleaning Angels", "Erica", "grayson", "Fountain Inn", "Moms Who Get It", "864-404-9955"

{HARD}
"""
    open(os.path.join(d, 'BRIEF.md'), 'w').write(brief)
    print(f"OK {dirname}: deploy={L['slug']}")

print("DONE")
