#!/usr/bin/env python3
"""Regenerate 7 off-trade demo images via SuperGrok OAuth (grok-imagine-image).
Gen in-process via urllib (works); download via curl (imgen.x.ai has Cloudflare that blocks Python UA)."""
import json, subprocess, os, sys

token = os.environ.get("XAI_TOKEN", "").strip()
if not token:
    token = subprocess.check_output(
        "cat /home/zach/.hermes/profiles/revenue-gen/auth.json | python3 -c "
        '"import sys,json; print(json.load(sys.stdin)[\'providers\'][\'xai-oauth\'][\'tokens\'][\'access_token\'])"',
        shell=True
    ).decode().strip()

API = "https://api.x.ai/v1/images/generations"

def gen_image(prompt):
    body = json.dumps({
        "model": "grok-imagine-image",
        "prompt": prompt,
        "n": 1,
        "response_format": "url"
    }).encode()
    import urllib.request, urllib.error
    req = urllib.request.Request(API, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req) as r:
        data = json.loads(r.read().decode())
        return data["data"][0]["url"]

def download_curl(url, dest):
    r = subprocess.run(
        ["curl", "-sS", "-f", "-o", dest, "-H", f"Authorization: Bearer {token}", url],
        capture_output=True, text=True
    )
    if r.returncode != 0:
        raise RuntimeError(f"curl download failed: {r.stderr.strip()}")
    return os.path.getsize(dest)

BASE = "/mnt/d/LocalLaunch/builder-work"
STYLE = ("Cinematic HD photograph of {scene}, professional, no close-up hands or faces, "
         "natural realistic textures, no plastic/fake look, 16:9 widescreen")

TASKS = [
    ("kanebreak-custom-backyards/work-a.jpg",
     STYLE.format(scene="a newly built wooden deck on a residential home")),
    ("kanebreak-custom-backyards/work-b.jpg",
     STYLE.format(scene="a new wooden privacy fence along a backyard")),
    ("milford-mountain-landscape/work-b.jpg",
     STYLE.format(scene="planting shrubs and flowers in a landscaped bed")),
    ("milford-mountain-landscape/work-d.jpg",
     STYLE.format(scene="a natural stone retaining wall and hardscape")),
    ("milford-mountain-landscape/about.jpg",
     STYLE.format(scene="a professionally landscaped garden with stone paths")),
    ("sbc-handyman-services/work-a.jpg",
     STYLE.format(scene="a technician repairing a kitchen appliance")),
    ("sbc-handyman-services/work-c.jpg",
     STYLE.format(scene="a light fixture being installed on a ceiling")),
]

results = []
for rel, prompt in TASKS:
    dest = os.path.join(BASE, rel)
    try:
        url = gen_image(prompt)
        size = download_curl(url, dest)
        results.append((rel, size))
        print(f"OK  {rel}  {size//1024} KB")
    except Exception as e:
        print(f"ERR {rel}: {type(e).__name__}: {e}")
        results.append((rel, "ERROR"))

print("\n=== REPORT ===")
for rel, size in results:
    if size == "ERROR":
        print(f"{rel}: ERROR")
    else:
        print(f"{rel}: {size//1024} KB")
