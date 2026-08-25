#!/usr/bin/env python3
"""Generate on-trade replacement images via SuperGrok OAuth (grok-imagine-image) + swap into demos."""
import json, urllib.request, subprocess, os

def get_token():
    return json.load(open('/home/zach/.hermes/profiles/revenue-gen/auth.json'))['providers']['xai-oauth']['tokens']['access_token']

TOK = get_token()

# (dest_abs_path, cinematic-HD on-trade prompt)
IMAGES = [
 ("/mnt/d/LocalLaunch/builder-work/kanebreak-custom-backyards/work-c.jpg",
  "Cinematic HD photograph of a newly built stone paver patio with elegant outdoor seating in a landscaped backyard, golden hour sunlight, shallow depth of field, crisp detail, professional real-estate photography, 16:9 widescreen"),
 ("/mnt/d/LocalLaunch/builder-work/kanebreak-custom-backyards/work-d.jpg",
  "Cinematic HD photograph of a beautiful outdoor living space with a wooden deck, pergola, string lights and comfortable patio furniture at dusk, warm inviting ambiance, 16:9 widescreen"),
 ("/mnt/d/LocalLaunch/builder-work/home-shield-roofing/svc3.jpg",
  "Cinematic HD photograph of a professional roofer in a safety harness inspecting asphalt shingles on a residential roof, golden hour, crisp detail, 16:9 widescreen"),
 ("/mnt/d/LocalLaunch/builder-work/home-shield-roofing/work-d.jpg",
  "Cinematic HD photograph of a roofing contractor kneeling on a roof ridge examining shingles up close, blue sky with dramatic clouds, 16:9 widescreen"),
 ("/mnt/d/LocalLaunch/builder-work/sbc-handyman-services/work-b.jpg",
  "Cinematic HD photograph of a handyman's hands applying joint compound to drywall with a wide putty knife, bright clean interior room, crisp detail, 16:9 widescreen"),
 ("/mnt/d/LocalLaunch/builder-work/milford-mountain-landscape/svc2.jpg",
  "Cinematic HD photograph of fresh dark hardwood mulch being spread around shrubs and flower beds in a landscaped garden, gardening rake and gloved hands, soft morning light, 16:9 widescreen"),
 ("/mnt/d/LocalLaunch/builder-work/milford-mountain-landscape/svc3.jpg",
  "Cinematic HD photograph of a natural flagstone path and stacked stone retaining wall in a lush landscaped garden, warm sunlight, crisp detail, 16:9 widescreen"),
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
        # download
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=60).read()
        with open(dest, 'wb') as f:
            f.write(data)
        print(f"  ✓ saved {os.path.basename(dest)} ({len(data)//1024}KB)")
    except Exception as e:
        print(f"  ✗ {os.path.basename(dest)}: {e}")
print("IMAGE GEN DONE")
