#!/usr/bin/env python3
"""
vercel_deploy.py — Deploy the Redwood Landscaping site to Vercel via REST API.
Replaces 'vercel' CLI which is broken on this machine (npm hangs).

Usage:
    python3 vercel_deploy.py              # Deploy current directory
    python3 vercel_deploy.py --prod       # Deploy and alias to production
    python3 vercel_deploy.py --env KEY=VAL  # Set env var and deploy
"""

import json, hashlib, os, sys, time, argparse, requests

VERCEL_TOKEN = json.load(open(os.path.expanduser("~/.vercel/auth.json")))["token"]
PROJECT = "local-launch"
PROD_DOMAIN = "local-launch-site.vercel.app"
HEADERS = {"Authorization": f"Bearer {VERCEL_TOKEN}"}
EXCLUDE_DIRS = {"node_modules", ".git", "__pycache__", ".hermes", "deploy", "reporting"}
EXCLUDE_FILES = {".pyc", "package-lock.json", "build-spec.md", "design-brief.md"}

SITE_DIR = os.path.dirname(os.path.abspath(__file__))


def compute_files():
    """Walk the site directory and return a Vercel files array."""
    files = []
    for root, dirs, filenames in os.walk(SITE_DIR):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for fn in filenames:
            if any(fn.endswith(ext) for ext in EXCLUDE_FILES):
                continue
            fpath = os.path.join(root, fn)
            with open(fpath, "rb") as f:
                content = f.read()
            sha = hashlib.sha1(content).hexdigest()
            relpath = os.path.relpath(fpath, SITE_DIR)
            files.append({"file": relpath, "sha": sha, "size": len(content)})
    return files


def upload_missing(files_array):
    """Upload files that Vercel doesn't have cached. Returns updated files array."""
    payload = {"name": PROJECT, "project": PROJECT, "target": "production", "files": files_array}
    resp = requests.post("https://api.vercel.com/v13/deployments", headers=HEADERS, json=payload, timeout=30)
    d = resp.json()

    error = d.get("error", {})
    if error.get("code") != "missing_files":
        if error:
            raise RuntimeError(f"Deployment creation failed: {error.get('message', error)}")
        return None, d  # No missing files, deployment created directly

    missing_shas = error.get("missing", [])
    print(f"Uploading {len(missing_shas)} missing files...")

    # Build SHA -> path+content map
    sha_map = {}
    for f in files_array:
        fpath = os.path.join(SITE_DIR, f["file"])
        with open(fpath, "rb") as fh:
            content = fh.read()
        sha_map[f["sha"]] = (fpath, content)

    for sha in missing_shas:
        if sha not in sha_map:
            print(f"  WARNING: SHA {sha[:12]} not found locally")
            continue
        fpath, content = sha_map[sha]
        fname = os.path.basename(fpath)
        print(f"  {fname} ({len(content)} bytes)...", end=" ")
        resp2 = requests.post(
            "https://api.vercel.com/v2/now/files",
            headers={**HEADERS, "Content-Type": "application/octet-stream", "x-vercel-digest": sha},
            data=content,
            timeout=15,
        )
        if resp2.status_code == 200:
            print("OK")
        else:
            print(f"FAILED ({resp2.status_code})")

    # Retry deployment
    resp3 = requests.post("https://api.vercel.com/v13/deployments", headers=HEADERS, json=payload, timeout=30)
    d3 = resp3.json()
    if d3.get("error"):
        raise RuntimeError(f"Deployment failed after upload: {d3['error'].get('message', d3['error'])}")
    return None, d3


def wait_for_ready(deployment_id, timeout=120):
    """Poll until deployment is READY."""
    start = time.time()
    while time.time() - start < timeout:
        resp = requests.get(
            f"https://api.vercel.com/v13/deployments/{deployment_id}",
            headers=HEADERS,
            timeout=10,
        )
        state = resp.json().get("readyState", "?")
        print(f"  {state}", end="", flush=True)
        if state == "READY":
            print()
            return True
        if state == "ERROR":
            print(" ← FAILED")
            return False
        time.sleep(3)
        print(".", end="", flush=True)
    print(" ← TIMEOUT")
    return False


def alias_to_production(deployment_id):
    """Point production domain to this deployment."""
    resp = requests.post(
        f"https://api.vercel.com/v2/deployments/{deployment_id}/aliases",
        headers=HEADERS,
        json={"alias": PROD_DOMAIN},
        timeout=10,
    )
    d = resp.json()
    if d.get("error"):
        if "already associated" in d["error"].get("message", ""):
            print(f"  Already aliased to {PROD_DOMAIN}")
            return True
        print(f"  Alias error: {d['error']['message']}")
        return False
    print(f"  Aliased to {PROD_DOMAIN}")
    return True


def set_env(key, value):
    """Set an environment variable on the Vercel project."""
    resp = requests.post(
        f"https://api.vercel.com/v10/projects/{PROJECT}/env?upsert=true",
        headers=HEADERS,
        json={"key": key, "value": value, "type": "encrypted", "target": ["production", "preview", "development"]},
        timeout=10,
    )
    d = resp.json()
    if d.get("error"):
        print(f"  Env error: {d['error']['message']}")
        return False
    print(f"  Set {key} (encrypted)")
    return True


def main():
    parser = argparse.ArgumentParser(description="Deploy Redwood site to Vercel")
    parser.add_argument("--prod", action="store_true", help="Alias to production after deploy")
    parser.add_argument("--env", action="append", help="Set env var (KEY=VALUE)", default=[])
    args = parser.parse_args()

    # Set env vars if requested
    for pair in args.env:
        if "=" in pair:
            k, v = pair.split("=", 1)
            set_env(k, v)

    # Compute files and deploy
    print(f"Computing files in {SITE_DIR}...")
    files = compute_files()
    print(f"Found {len(files)} files ({sum(f['size'] for f in files):,} bytes)")

    print("Creating deployment...")
    result, deployment = upload_missing(files)

    if result is not None:
        deployment = result

    dep_id = deployment.get("id") or deployment.get("uid", "?")
    dep_url = deployment.get("url", "?")
    print(f"Deployment: {dep_id}")
    print(f"Preview URL: https://{dep_url}")
    print("Waiting for ready", end="", flush=True)
    
    if not wait_for_ready(dep_id):
        sys.exit(1)

    if args.prod:
        print("Aliasing to production...")
        alias_to_production(dep_id)

    print(f"\n✅ Deployed! https://{PROD_DOMAIN}")


if __name__ == "__main__":
    main()
