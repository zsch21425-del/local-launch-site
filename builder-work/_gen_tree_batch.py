#!/usr/bin/env python3
"""Generate 4 DISTINCT tree-service gallery images per lead (16 total) via Gemini.
Distinct from each other AND from the canonical template's originals."""
import os, json, base64, io, urllib.request
from PIL import Image

key = None
for line in open('/home/zach/.hermes/.env'):
    if line.strip().startswith('GEMINI_API_KEY='):
        key = line.strip().split('=', 1)[1].strip(); break
assert key, "no GEMINI_API_KEY"

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
            _RS = getattr(Image, 'Resampling', None)
            _L = _RS.LANCZOS if _RS else getattr(Image, 'LANCZOS', Image.BICUBIC)
            img.thumbnail((max_w, max_w), _L)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            img.save(out, 'JPEG', quality=q, optimize=True)
            return f"ok {os.path.getsize(out)//1024}KB"
    return "no image"

P = "Professional photorealistic photograph of {}, natural lighting, no people (or only distant figures), no text, no watermark, sharp detail, residential South Carolina setting."

JOBS = {
  'robertsons-tree-service': [
    ('work-a.jpg', 'a professional arborist in a climbing harness and ropes ascending a large mature oak tree, ready for removal'),
    ('work-b.jpg', 'a commercial wood chipper blowing freshly shredded wood chips into a pile on a residential lawn'),
    ('work-c.jpg', 'neatly stacked freshly split firewood logs on a residential property'),
    ('work-d.jpg', 'a large tree limb being lowered by rope and rigging from a crane-assisted tree removal'),
  ],
  'sasquatch-tree-services': [
    ('work-a.jpg', 'an aerial bucket truck with an arborist trimming high dead branches on a tall pine tree'),
    ('work-b.jpg', 'a stump grinder machine grinding a fresh tree stump down to wood chips on a lawn'),
    ('work-c.jpg', 'an arborist using a long pole saw to prune a tree canopy, clean shaping'),
    ('work-d.jpg', 'storm damage cleanup, a crew removing a large fallen tree limb from a yard'),
  ],
  'rig-line-tree-service': [
    ('work-a.jpg', 'a tree being felled with a notch cut, leaning toward an open clearing'),
    ('work-b.jpg', 'a log truck loaded with freshly cut tree trunks ready for hauling'),
    ('work-c.jpg', 'crown thinning of a mature maple tree, thinning shears on a branch'),
    ('work-d.jpg', 'brush clearing of an overgrown lot, cut vegetation piled for removal'),
  ],
  'montes-tree-service': [
    ('work-a.jpg', 'a tree removal crew cutting down a large tree beside a house, controlled drop'),
    ('work-b.jpg', 'a large pile of freshly split firewood with a splitting axe leaning nearby'),
    ('work-c.jpg', 'a landscaper trimming and shaping a neat row of hedges'),
    ('work-d.jpg', 'tree health care, cabling and bracing a large split tree trunk for support'),
  ],
}

base = '/mnt/d/LocalLaunch/builder-work'
for slug, jobs in JOBS.items():
    for fname, subj in jobs:
        out = os.path.join(base, slug, fname)
        r = gen(P.format(subj), out)
        print(f"{slug}/{fname}: {r}", flush=True)
print("DONE")
