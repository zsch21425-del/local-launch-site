#!/usr/bin/env python3
"""Regenerate All In One images via xAI OAuth (grok-imagine-image) + fix img mappings."""
import base64, json, io, os, time, urllib.request, urllib.error
from PIL import Image

tok = json.load(open('/home/zach/.hermes/profiles/local-launch-supervisor/auth.json'))['providers']['xai-oauth']['tokens']['access_token']

def gen(prompt, out):
    body = json.dumps({"model": "grok-imagine-image", "prompt": prompt, "n": 1, "response_format": "url"})
    req = urllib.request.Request('https://api.x.ai/v1/images/generations',
        data=body.encode(), headers={'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json'})
    for attempt in range(5):
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=90).read())
            url = r['data'][0]['url']
            imgreq = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            data = urllib.request.urlopen(imgreq, timeout=60).read()
            img = Image.open(io.BytesIO(data)).convert('RGB')
            _RS = getattr(Image, 'Resampling', None)
            _LZ = _RS.LANCZOS if _RS else getattr(Image, 'LANCZOS', Image.BICUBIC)
            img.thumbnail((1920, 1920), _LZ)
            img.save(out, 'JPEG', quality=82, optimize=True)
            return True
        except urllib.error.HTTPError as e:
            if e.code in (429, 503, 502):
                time.sleep(20); continue
            print(f"  ERR {e.code}: {e.read().decode()[:120]}"); return False
        except Exception as e:
            print(f"  ERR {e}"); return False
    return False

P = "Professional photorealistic photograph of {}, natural lighting, no people, no text, no watermark, sharp detail."
D = '/mnt/d/LocalLaunch/builder-work/all-in-one-maintenance'

jobs = [
    ('svc0.jpg', 'a pile of household junk, old furniture and yard debris loaded onto a trailer, cleared out from a home'),
    ('svc1.jpg', 'a freshly mowed green lawn with clean mowing stripes in a residential yard'),
    ('svc2.jpg', 'a set of handyman tools and a ladder leaning against a wall during a home repair'),
    ('svc3.jpg', 'a freshly painted exterior house wall with crisp trim, a paint roller and tray resting on a drop cloth'),
    ('work-a.jpg', 'a clean, swept, empty garage after a junk removal job'),
    ('work-b.jpg', 'a neatly edged and mowed lawn running along a wooden fence line'),
    ('work-c.jpg', 'a newly repaired wooden porch railing with fresh boards'),
    ('work-d.jpg', 'a freshly painted exterior wall and trim with sharp clean edges'),
    ('about.jpg', 'a well-maintained home exterior with a mowed lawn, a repaired fence, and freshly painted trim'),
]
for fn, subj in jobs:
    ok = gen(P.format(subj), os.path.join(D, fn))
    print(('✓' if ok else '✗'), fn)
    time.sleep(2)

# ---- HTML rewrites ----
p = os.path.join(D, 'index.html')
h = open(p, encoding='utf-8').read()
def repl(h, o, n):
    assert o in h, f"MISSING: {o[:60]!r}"
    return h.replace(o, n)

h = repl(h, '<img class="service-thumb" src="svc-home.jpg" alt="Handyman home repair and maintenance" loading="lazy">',
           '<img class="service-thumb" src="svc0.jpg" alt="Junk removal and hauling" loading="lazy">')
h = repl(h, '<img class="service-thumb" src="work-wall2.jpg" alt="Grass Cutting &amp; Lawn Care planting pruning and lawn care" loading="lazy">',
           '<img class="service-thumb" src="svc1.jpg" alt="Grass cutting and lawn care" loading="lazy">')
h = repl(h, '<img class="service-thumb" src="svc-pw.jpg" alt="Pressure washing driveways walkways and siding" loading="lazy">',
           '<img class="service-thumb" src="svc2.jpg" alt="Handyman repairs and odd jobs" loading="lazy">')
h = repl(h, '<img class="service-thumb" src="hero-poster.jpg" alt="Home renovation and remodeling project" loading="lazy">',
           '<img class="service-thumb" src="svc3.jpg" alt="Exterior painting and touch-ups" loading="lazy">')

h = repl(h, '<div class="service-icon"><i class="fa-solid fa-hammer"></i></div>\n        <h3>Junk Removal',
           '<div class="service-icon"><i class="fa-solid fa-dumpster"></i></div>\n        <h3>Junk Removal')
h = repl(h, '<div class="service-icon"><i class="fa-solid fa-spray-can-sparkles"></i></div>\n        <h3>Handyman Service',
           '<div class="service-icon"><i class="fa-solid fa-hammer"></i></div>\n        <h3>Handyman Service')
h = repl(h, '<div class="service-icon"><i class="fa-solid fa-trowel-bricks"></i></div>\n        <h3>Exterior Painting',
           '<div class="service-icon"><i class="fa-solid fa-paint-roller"></i></div>\n        <h3>Exterior Painting')

h = repl(h, '<img src="svc-home.jpg" alt="Home maintenance and repair work in Pelzer SC" loading="lazy"><div class="gallery-cap">Home Maintenance</div>',
           '<img src="work-a.jpg" alt="Junk removal work" loading="lazy"><div class="gallery-cap">Junk Removal</div>')
h = repl(h, '<img src="work-wall2.jpg" alt="Pressure washing work" loading="lazy"><div class="gallery-cap">Handyman Service</div>',
           '<img src="work-b.jpg" alt="Grass cutting work" loading="lazy"><div class="gallery-cap">Grass Cutting &amp; Lawn Care</div>')
h = repl(h, '<img src="svc-pw.jpg" alt="Grass Cutting &amp; Lawn Care work" loading="lazy"><div class="gallery-cap">Grass Cutting &amp; Lawn Care</div>',
           '<img src="work-c.jpg" alt="Handyman work" loading="lazy"><div class="gallery-cap">Handyman Service</div>')
h = repl(h, '<img src="work-sod.jpg" alt="Home renovation work" loading="lazy"><div class="gallery-cap">Renovation</div>',
           '<img src="work-d.jpg" alt="Exterior painting work" loading="lazy"><div class="gallery-cap">Exterior Painting</div>')

h = repl(h, '<img src="about.jpg" alt="Handyman and landscaping work in Pelzer, SC" loading="lazy">',
           '<img src="about.jpg" alt="Junk removal, lawn care, handyman and painting work in Pelzer, SC" loading="lazy">')
h = repl(h, 'Grass Cutting &amp; Lawn Care, pressure washing, handyman repairs, and renovations',
           'junk removal, grass cutting, handyman repairs, and exterior painting')

open(p, 'w', encoding='utf-8').write(h)
print("HTML rewritten")
