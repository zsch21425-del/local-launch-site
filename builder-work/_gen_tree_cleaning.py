#!/usr/bin/env python3
"""Generate trade-correct images for Lumberjack Tree Service + Cleaning Angels demos via Gemini."""
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

TREE = '/mnt/d/LocalLaunch/builder-work/lumberjack-tree-service'
CLEAN = '/mnt/d/LocalLaunch/builder-work/cleaning-angels'

TREE_JOBS = [
    ('hero-poster.jpg', '16:9', 'a dramatic golden-hour view of a large mature oak tree beside a professional aerial bucket truck on a residential lawn, warm sunlight'),
    ('work-a.jpg', '4:3', 'freshly cut tree logs stacked neatly on a residential lawn next to a wood chipper'),
    ('work-b.jpg', '4:3', 'a tree stump freshly ground down to wood chips on a grassy lawn'),
    ('work-c.jpg', '4:3', 'a professional aerial bucket truck extended up beside a tall tree against a clear blue sky'),
    ('work-d.jpg', '4:3', 'neatly trimmed tree branches and a clean well-maintained residential yard'),
]

CLEAN_JOBS = [
    ('hero-poster.jpg', '16:9', 'a bright spotless modern living room with soft natural window light, fresh and clean'),
    ('work-a.jpg', '4:3', 'a sparkling clean bathroom with gleaming fixtures, folded white towels, and a spotless mirror'),
    ('work-b.jpg', '4:3', 'a perfectly organized closet with neatly folded clothes and labeled storage bins'),
    ('work-c.jpg', '4:3', 'a spotless modern kitchen with gleaming countertops and clean stainless steel appliances'),
    ('work-d.jpg', '4:3', 'a tidy freshly made bed in a clean bedroom with soft morning light'),
]

for fname, asp, subj in TREE_JOBS:
    r = gen(P.format(subj), os.path.join(TREE, fname), aspect=asp)
    print(f"TREE {fname}: {r}", flush=True)
for fname, asp, subj in CLEAN_JOBS:
    r = gen(P.format(subj), os.path.join(CLEAN, fname), aspect=asp)
    print(f"CLEAN {fname}: {r}", flush=True)
print("DONE")
