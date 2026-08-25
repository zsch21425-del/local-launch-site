#!/usr/bin/env python3
"""Fix 3 off-trade demos: regenerate correct on-trade images via SuperGrok OAuth."""
import json, urllib.request, os, shutil

def get_token():
    return json.load(open('/home/zach/.hermes/profiles/revenue-gen/auth.json'))['providers']['xai-oauth']['tokens']['access_token']
TOK = get_token()

B = '/mnt/d/LocalLaunch/builder-work'
# (dest_abs_path, prompt) — overwrite broken files; no people/hands/text to avoid AI-slop
IMAGES = [
 # ---- WINDOW (gulottas; copied to upstate after) ----
 (f'{B}/gulottas-window-cleaning/pw-street-web-poster.jpg',
  "Cinematic HD photograph of a residential window being cleaned, a squeegee gliding across sparkling glass leaving a streak-free shine with a bright blue sky reflected, crisp detail, no people no hands no text, 16:9 widescreen"),
 (f'{B}/gulottas-window-cleaning/driveway-before-real.jpg',
  "Documentary-style photograph of a dirty residential window covered in grime, water spots and streaks, overcast natural light, imperfect natural textures, no people no text, 16:9 widescreen"),
 (f'{B}/gulottas-window-cleaning/driveway-after-real.jpg',
  "Documentary-style photograph of a crystal-clear sparkling clean residential window, bright daylight, streak-free glass, no people no text, 16:9 widescreen"),
 (f'{B}/gulottas-window-cleaning/svc-driveway.jpg',
  "Professional residential window cleaning in progress, a squeegee and soap suds on a large pane of glass, soft morning light, no people no hands no text, 16:9 widescreen"),
 (f'{B}/gulottas-window-cleaning/svc-siding.jpg',
  "Documentary-style photograph of gutter cleaning, a ladder against a home eave with a cleaned white gutter, no people no text, 16:9 widescreen"),
 (f'{B}/gulottas-window-cleaning/svc-patio.jpg',
  "Documentary-style photograph of a window screen being cleaned with a soft brush, screen mesh detail in a bright window frame, no people no hands no text, 16:9 widescreen"),
 (f'{B}/gulottas-window-cleaning/svc-commercial.jpg',
  "Cinematic photograph of gleaming clean commercial storefront glass windows on a sunny day, crisp reflection, no people no text, 16:9 widescreen"),
 (f'{B}/gulottas-window-cleaning/pw-reviews-web-poster.jpg',
  "Cinematic HD photograph of a clean modern home exterior with sparkling windows at golden hour, no people no text, 16:9 widescreen"),

 # ---- KANEBREAK (backyard / outdoor living) ----
 (f'{B}/kanebreak-custom-backyards/hero-poster.jpg',
  "Cinematic HD photograph of a luxury backyard outdoor living space with a wooden deck, stone paver patio, pergola and a stone fire pit, warm string lights at golden hour, no people no text, 16:9 widescreen"),
 (f'{B}/kanebreak-custom-backyards/work-a.jpg',
  "Documentary-style photograph of a custom cedar wooden deck built in a landscaped backyard, natural wood grain, soft afternoon light, no people no text, 16:9 widescreen"),
 (f'{B}/kanebreak-custom-backyards/work-b.jpg',
  "Documentary-style photograph of a new wooden privacy fence along a backyard property line, fresh natural lumber, no people no text, 16:9 widescreen"),
 (f'{B}/kanebreak-custom-backyards/work-c.jpg',
  "Cinematic HD photograph of a newly built stone paver patio with elegant outdoor seating in a landscaped backyard, golden hour, no people no text, 16:9 widescreen"),
 (f'{B}/kanebreak-custom-backyards/work-d.jpg',
  "Cinematic HD photograph of a covered outdoor living area with a pergola, string lights and comfortable patio furniture at dusk, warm inviting ambiance, no people no text, 16:9 widescreen"),
 (f'{B}/kanebreak-custom-backyards/about.jpg',
  "Documentary-style photograph of a beautifully transformed landscaped backyard with a deck and patio, natural imperfect textures, soft light, no people no text, 16:9 widescreen"),
 (f'{B}/kanebreak-custom-backyards/reviews-bg.jpg',
  "Cinematic photograph of a backyard patio with an outdoor fire pit and seating at dusk, no people no text, 16:9 widescreen"),
 (f'{B}/kanebreak-custom-backyards/services-bg.jpg',
  "Wide cinematic photograph of a lush landscaped backyard with a wooden deck and stone patio, no people no text, 16:9 widescreen"),

 # ---- ALL IN ONE (maintenance: junk / lawn / handyman / hauling) ----
 (f'{B}/all-in-one-maintenance/ai-junk.jpg',
  "Documentary-style photograph of a loaded junk removal truck with household debris and old furniture, no people no text, 16:9 widescreen"),
 (f'{B}/all-in-one-maintenance/ai-lawn.jpg',
  "Cinematic HD photograph of a freshly mowed green lawn with clean mowing stripes, no people no text, 16:9 widescreen"),
 (f'{B}/all-in-one-maintenance/ai-handyman.jpg',
  "Documentary-style photograph of a home handyman repair scene, toolbox and a workbench with tools in a bright room, no people no hands no text, 16:9 widescreen"),
 (f'{B}/all-in-one-maintenance/ai-hauling.jpg',
  "Documentary-style photograph of a pickup truck loaded with boxes and hauling debris in a driveway, no people no text, 16:9 widescreen"),
]

def gen(prompt):
    body = json.dumps({"model":"grok-imagine-image","prompt":prompt,"n":1,"response_format":"url"})
    req = urllib.request.Request("https://api.x.ai/v1/images/generations", data=body.encode(),
        headers={"Authorization":"Bearer "+TOK, "Content-Type":"application/json"})
    r = json.loads(urllib.request.urlopen(req, timeout=90).read())
    return r['data'][0]['url']

for i, (dest, prompt) in enumerate(IMAGES):
    print(f"[{i+1}/{len(IMAGES)}] {os.path.basename(dest)} ...", flush=True)
    try:
        url = gen(prompt)
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=60).read()
        with open(dest, 'wb') as f:
            f.write(data)
        print(f"  OK {os.path.basename(dest)} ({len(data)//1024}KB)", flush=True)
    except Exception as e:
        print(f"  FAIL {os.path.basename(dest)}: {e}", flush=True)
print("IMAGE GEN DONE")
