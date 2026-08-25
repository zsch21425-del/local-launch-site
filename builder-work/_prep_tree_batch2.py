#!/usr/bin/env python3
"""Fork tree-service -> 2 new tree leads, gen 4 distinct gallery images each, write briefs + patch deploy."""
import os, json, base64, io, re, shutil, urllib.request
from PIL import Image

BASE = '/mnt/d/LocalLaunch/builder-work'
TPL = '/mnt/d/LocalLaunch/templates/tree-service'

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

P = "Professional photorealistic photograph of {}, natural lighting, no people (or only distant figures), no text, no watermark, sharp detail, residential South Carolina setting."

LEADS = {
  'taylors-tree-service': dict(
    name="Taylor's Tree Service", city='Spartanburg', phone='(864) 585-5381',
    digits='18645855381', email='penny@taylorstreeservices.com', slug='taylors-tree-demo',
    services=['Tree Removal', 'Tree Trimming', 'Stump Grinding', 'Storm Cleanup'],
    images=[
      ('work-a.jpg', 'a professional arborist in a climbing harness ascending a large mature oak tree with ropes'),
      ('work-b.jpg', 'a commercial wood chipper blowing freshly shredded wood chips into a pile on a residential lawn'),
      ('work-c.jpg', 'a stump grinder machine grinding a large tree stump in a grassy backyard'),
      ('work-d.jpg', 'a bucket truck lifting an arborist up to trim a tall pine tree beside a house'),
    ]),
  'cedar-guy-tree-service': dict(
    name='Cedar Guy Tree Service', city='Travelers Rest', phone='(864) 906-0183',
    digits='18649060183', email='customcedarguy@gmail.com', slug='cedar-guy-tree-demo',
    services=['Tree Removal', 'Limb Pruning', 'Arborist Care', 'Emergency & Storm Cleanup'],
    images=[
      ('work-a.jpg', 'a crew with chainsaws and ropes removing a large storm-downed tree from a residential front yard'),
      ('work-b.jpg', 'an arborist pruning high limbs of a mature tree using a pole saw from the ground'),
      ('work-c.jpg', 'a crane hoisting a large section of a removed tree trunk over a suburban backyard'),
      ('work-d.jpg', 'trimming and shaping a tall evergreen cedar tree beside a rural South Carolina home'),
    ]),
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
    # fork
    if os.path.exists(d): shutil.rmtree(d)
    shutil.copytree(TPL, d)
    for f in ['BRIEF.md', 'TEMPLATE-BRIEF.md', 'README.md']:
        p = os.path.join(d, f)
        if os.path.exists(p): os.remove(p)
    # generate images
    for fn, prompt in L['images']:
        r = gen(P.format(prompt), os.path.join(d, fn))
        print(f"  {dirname}/{fn}: {r}")
    # patch deploy.py
    dp = os.path.join(d, 'deploy.py')
    s = open(dp).read()
    s = re.sub(r'PROJECT\s*=\s*"[^"]*"', f'PROJECT = "{L["slug"]}"', s)
    open(dp, 'w').write(s)
    # write brief
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
6. Trust marquee → ONLY verified items: use "{marquee}" and "Serving {L['city']} & the Upstate". REMOVE all unverified claims ("12 Years", "24/7 Emergency", "Free Estimates", "Veteran & Senior Discounts", "licensed & insured").
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
    print(f"OK {dirname}: deploy={L['slug']}, brief ({len(brief)} chars)")

print("DONE")
