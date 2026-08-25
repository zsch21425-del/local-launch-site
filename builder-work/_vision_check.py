#!/usr/bin/env python3
import base64, json, urllib.request, io, time, os
from PIL import Image

key = None
for line in open('/home/zach/.hermes/.env'):
    if line.strip().startswith('GEMINI_API_KEY='):
        key = line.strip().split('=', 1)[1].strip(); break

def vision_b64(b64data, mime, question, retries=3):
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
    body = {"contents": [{"parts": [{"inlineData": {"mimeType": mime, "data": b64data}}, {"text": question}]}]}
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'X-goog-api-key': key, 'Content-Type': 'application/json'})
    for i in range(retries):
        try:
            r = json.loads(urllib.request.urlopen(req, timeout=90).read())
            return r['candidates'][0]['content']['parts'][0]['text'].strip()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(15); continue
            return f"ERR {e.code}"
        except Exception as e:
            return f"ERR {e}"
    return "ERR 429"

def bands(path, n=3, max_w=1000, q=60):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    out = []
    band_h = h // n
    overlap = 80
    for i in range(n):
        top = max(0, i * band_h - overlap)
        bot = min(h, (i + 1) * band_h + overlap)
        crop = im.crop((0, top, w, bot))
        if crop.width > max_w:
            crop = crop.resize((max_w, int(crop.height * max_w / crop.width)), Image.LANCZOS)
        buf = io.BytesIO(); crop.save(buf, 'JPEG', quality=q)
        out.append(base64.b64encode(buf.getvalue()).decode())
    return out

Q = ("This is one vertical band of a website screenshot. List ONLY concrete layout/visual defects: "
     "text overlapping, cut-off or clipped elements, awkward image crops, white gaps, broken/blank images, "
     "misaligned cards, low-contrast unreadable text. Be specific with location. If clean, reply exactly CLEAN.")

log = open('/tmp/vision_check.log', 'w')
for slug in ['mml', 'kb', 'fb', 'aio', 'wt']:
    for view in ['desk', 'mob']:
        p = f'/tmp/{slug}_{view}.png'
        if not os.path.exists(p):
            log.write(f"\n{slug}/{view}: NO CAPTURE\n"); continue
        log.write(f"\n===== {slug}/{view} =====\n"); log.flush()
        for bi, b in enumerate(bands(p)):
            r = vision_b64(b, 'image/jpeg', Q)
            log.write(f"  band {bi+1}: {r}\n"); log.flush()
            time.sleep(1.5)
log.write("\nDONE\n"); log.close()
print("vision check complete")
