import base64, json, urllib.request, io, os
from PIL import Image

key = None
for line in open('/home/zach/.hermes/.env'):
    if line.strip().startswith('GEMINI_API_KEY='):
        key = line.strip().split('=', 1)[1].strip(); break

def gen(prompt, out):
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "4:3"}}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
    data = json.loads(urllib.request.urlopen(req, timeout=120).read())
    for p in data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
        if 'inlineData' in p:
            img = Image.open(io.BytesIO(base64.b64decode(p['inlineData']['data']))).convert('RGB')
            img.thumbnail((1400, 1400), Image.LANCZOS)
            img.save(out, 'JPEG', quality=82, optimize=True)
            return f"ok {os.path.getsize(out)//1024}KB"
    return "no image"

P = "Professional photorealistic photograph of {}, natural lighting, no text, no watermark, sharp detail, residential South Carolina setting."
BASE = '/mnt/d/LocalLaunch/builder-work'

jobs = [
  ('leos-pro-line-painting/work-c.jpg', P.format("a painter's hand applying fresh white paint to a kitchen cabinet door with a brush, one cabinet door half-painted showing the contrast between old wood and crisp new white paint")),
  ('gray-wolf-concrete/work-grading.jpg', P.format("a crew troweling and finishing a freshly poured concrete slab with wood forms still in place, smooth wet concrete surface")),
  ('spartan-paver-sealing/work-repair.jpg', P.format("a close-up of a worker applying a clear sealant to a paver patio with a paint roller, glossy wet-look finish on the pavers, up-close detail")),
]
for out, pr in jobs:
    print(out, "->", gen(pr, os.path.join(BASE, out)))
print("DONE")
