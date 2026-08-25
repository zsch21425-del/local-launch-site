#!/usr/bin/env python3
"""Generate trade-correct images for Home Shield Roofing + SBC Handyman demos via Gemini."""
import os, json, base64, io, urllib.request

from PIL import Image

key = None
for line in open('/home/zach/.hermes/.env'):
    if line.strip().startswith('GEMINI_API_KEY='):
        key = line.strip().split('=', 1)[1].strip()
        break
assert key, "no GEMINI_API_KEY"

def gen(prompt, out, aspect='4:3', max_w=1920, q=82):
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
            _RS = getattr(Image, 'Resampling', None)
            _L = _RS.LANCZOS if _RS else getattr(Image, 'LANCZOS', Image.BICUBIC)
            img.thumbnail((max_w, max_w), _L)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            img.save(out, 'JPEG', quality=q, optimize=True)
            return f"ok {os.path.getsize(out)//1024}KB"
    return "no image"

P = "Professional photorealistic photograph of {}, natural lighting, no people, no text, no watermark, sharp detail."

# (dir, filename, aspect, subject)
JOBS = []
ROOF = '/mnt/d/LocalLaunch/builder-work/home-shield-roofing'
HB = '/mnt/d/LocalLaunch/builder-work/sbc-handyman'

ROOF_JOBS = [
    ('hero-poster.jpg', '16:9', 'a dramatic view of a brand-new dimensional asphalt shingle roof on a suburban home at golden hour, clean ridge lines, warm sunlight'),
    ('svc0.jpg', '4:3', 'close-up of new dimensional asphalt shingles in slate and grey tones, textured surface'),
    ('svc1.jpg', '4:3', 'a roof with new metal flashing around a chimney and a repaired section'),
    ('svc2.jpg', '4:3', 'clean aluminum gutters and downspouts along the eaves of a house with new siding'),
    ('svc3.jpg', '4:3', 'a newly renovated modern kitchen with new cabinets and countertops'),
    ('work-a.jpg', '4:3', 'a standing seam metal roof on a house, gleaming in sunlight'),
    ('work-b.jpg', '4:3', 'a freshly replaced shingle roof on a suburban home, wide shot'),
    ('work-c.jpg', '4:3', 'a new gutter and downspout installation detail on a house exterior'),
    ('work-d.jpg', '4:3', 'a newly renovated bathroom with new tile and fixtures'),
    ('about.jpg', '4:3', 'roofing tools and new shingle bundles neatly arranged on a rooftop workspace'),
    ('reviews-bg.jpg', '16:9', 'a quiet suburban neighborhood of homes with well-maintained roofs at golden hour'),
]

HB_JOBS = [
    ('hero-poster.jpg', '16:9', 'a tidy home workshop with an organized workbench and hand tools, warm ambient light'),
    ('svc0.jpg', '4:3', 'a modern stainless steel kitchen appliance in a clean kitchen'),
    ('svc1.jpg', '4:3', 'wood framing studs and construction lumber on a job site'),
    ('svc2.jpg', '4:3', 'a smooth freshly finished drywall wall with clean corners'),
    ('svc3.jpg', '4:3', 'a new modern ceiling light fixture installed, softly glowing'),
    ('work-a.jpg', '4:3', 'a patched and freshly painted drywall wall repair'),
    ('work-b.jpg', '4:3', 'an installed modern light fixture glowing warm in a hallway'),
    ('work-c.jpg', '4:3', 'construction framing with studs and a level'),
    ('work-d.jpg', '4:3', 'a newly installed kitchen appliance in a modern kitchen'),
    ('about.jpg', '4:3', 'an organized handyman toolbox with assorted tools, close-up'),
    ('reviews-bg.jpg', '16:9', 'a cozy warm home interior living room with soft evening light'),
]

for fname, asp, subj in ROOF_JOBS:
    r = gen(P.format(subj), os.path.join(ROOF, fname), aspect=asp)
    print(f"ROOF {fname}: {r}", flush=True)
for fname, asp, subj in HB_JOBS:
    r = gen(P.format(subj), os.path.join(HB, fname), aspect=asp)
    print(f"HB   {fname}: {r}", flush=True)
print("DONE")
