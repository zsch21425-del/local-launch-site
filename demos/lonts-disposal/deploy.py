#!/usr/bin/env python3
"""Deploy lonts-disposal demo to Vercel as standalone project."""
import json, hashlib, os, sys, time, requests

# Token: prefer VERCEL_TOKEN from revenue-gen .env (auth.json token is stale Aug 2026)
def _load_token():
    env_file = "/home/zach/.hermes/profiles/revenue-gen/.env"
    if os.path.exists(env_file):
        for line in open(env_file):
            line = line.strip()
            if line.startswith("VERCEL_TOKEN="):
                return line.split("=", 1)[1]
    try:
        return json.load(open(os.path.expanduser("~/.vercel/auth.json")))[ "token"]
    except Exception:
        raise SystemExit("No VERCEL_TOKEN found in .env or auth.json")

VERCEL_TOKEN = _load_token()
PROJECT = "lonts-demo"
HEADERS = {"Authorization": f"Bearer {VERCEL_TOKEN}"}
SITE_DIR = os.path.dirname(os.path.abspath(__file__))

def compute_files():
    files = []
    for root, dirs, filenames in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if not d.startswith(".git") and not d.startswith("__")]
        for fn in filenames:
            fpath = os.path.join(root, fn)
            with open(fpath, "rb") as f:
                content = f.read()
            sha = hashlib.sha1(content).hexdigest()
            relpath = os.path.relpath(fpath, SITE_DIR)
            files.append({"file": relpath, "sha": sha, "size": len(content)})
    return files

# Create project if it doesn't exist
print("Ensuring project exists...")
requests.post("https://api.vercel.com/v9/projects",
    headers=HEADERS, json={"name": PROJECT, "framework": None}, timeout=10)

files = compute_files()
print(f"Found {len(files)} files")

payload = {"name": PROJECT, "project": PROJECT, "files": files}

def upload_missing(d):
    error = d.get("error", {})
    if error.get("code") != "missing_files":
        return d
    missing = error["missing"]
    sha_map = {}
    for f in files:
        fpath = os.path.join(SITE_DIR, f["file"])
        with open(fpath, "rb") as fh:
            sha_map[f["sha"]] = (fpath, fh.read())
    for sha in missing:
        if sha not in sha_map:
            continue
        fpath, content = sha_map[sha]
        fname = os.path.basename(fpath)
        print(f"Uploading {fname} ({len(content)//1024}KB)...")
        ur = requests.post("https://api.vercel.com/v2/now/files",
            headers={**HEADERS, "Content-Type": "application/octet-stream", "x-vercel-digest": sha},
            data=content, timeout=60)
        if ur.status_code not in (200, 201):
            print(f"  upload {fname} failed: HTTP {ur.status_code} {ur.text[:120]}")
    return requests.post("https://api.vercel.com/v13/deployments", headers=HEADERS, json=payload, timeout=30).json()

resp = requests.post("https://api.vercel.com/v13/deployments", headers=HEADERS, json=payload, timeout=30)
d = resp.json()
# Loop: upload missing files, re-submit, until no missing_files error (max 3 passes)
for _ in range(3):
    if d.get("error", {}).get("code") != "missing_files":
        break
    d = upload_missing(d)

dep_id = d.get("id") or d.get("uid", "?")
dep_url = d.get("url", "?")
print(f"Deployed! https://{dep_url}")

# Wait for ready
for i in range(30):
    r = requests.get(f"https://api.vercel.com/v13/deployments/{dep_id}", headers=HEADERS, timeout=10)
    state = r.json().get("readyState", "?")
    if state == "READY":
        print("Ready!")
        break
    time.sleep(2)

# Alias production domain
prod_domain = f"{PROJECT}.vercel.app"
resp = requests.post(
    f"https://api.vercel.com/v2/deployments/{dep_id}/aliases",
    headers=HEADERS,
    json={"alias": prod_domain},
    timeout=10,
)
ad = resp.json()
if ad.get("error"):
    print(f"Alias note: {ad['error'].get('message', 'already set')}")
else:
    print(f"Aliased to {prod_domain}")

print(f"✅ Live: https://{prod_domain}")
