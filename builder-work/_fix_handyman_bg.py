import base64, json, urllib.request, io, os, shutil
from PIL import Image

key = None
for line in open('/home/zach/.hermes/.env'):
    if line.strip().startswith('GEMINI_API_KEY='):
        key = line.strip().split('=', 1)[1].strip(); break

def gen(prompt, out):
    url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9"}}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={'x-goog-api-key': key, 'Content-Type': 'application/json'})
    data = json.loads(urllib.request.urlopen(req, timeout=120).read())
    for p in data.get('candidates', [{}])[0].get('content', {}).get('parts', []):
        if 'inlineData' in p:
            img = Image.open(io.BytesIO(base64.b64decode(p['inlineData']['data']))).convert('RGB')
            img.thumbnail((1920, 1920), Image.LANCZOS)
            img.save(out, 'JPEG', quality=85, optimize=True)
            return f"ok {os.path.getsize(out)//1024}KB"
    return "no image"

BASE = '/mnt/d/LocalLaunch/builder-work'
tmp_services = '/tmp/handyman-services-bg.jpg'
tmp_reviews = '/tmp/handyman-reviews-bg.jpg'

print("services-bg:", gen("a dark moody flat-lay of handyman tools (hammer, wrench, screwdriver, tape measure) on a worn wooden workbench, dim workshop lighting, dark cinematic tones, no text, no watermark", tmp_services))
print("reviews-bg:", gen("a residential suburban neighborhood street at dusk with warm porch lights glowing, soft blue-hour lighting, no text, no watermark, no people", tmp_reviews))

for d in ['joshua-truitt-handyman','kirk-johnson-handyman','pvp-home-services']:
    shutil.copy(tmp_services, os.path.join(BASE, d, 'services-bg.jpg'))
    shutil.copy(tmp_reviews, os.path.join(BASE, d, 'reviews-bg.jpg'))
    print("copied to", d)
print("DONE")
