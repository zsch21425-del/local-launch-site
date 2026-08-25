#!/usr/bin/env python3
"""
deploy_local_launch_demos.py — Deploy Local Launch standalone demo/experiment pages
to their own Vercel project so they never touch the production Local Launch site.

Deploys ONLY these files from the demos/ directory:
  demo.html, demo-v2.html .. demo-v9.html, demo-redesign.html,
  demo-scroll.html, demo-scroll-page2.html, index-v3.html, index_backup.html

Usage:
    python3 deploy_local_launch_demos.py --prod

Result: https://local-launch-demos.vercel.app/demo.html (etc.)
"""
import json, hashlib, os, sys, time, argparse, requests

VERCEL_TOKEN = json.load(open(os.path.expanduser("~/.vercel/auth.json")))["token"]
PROJECT = "local-launch-demos"
HEADERS = {"Authorization": f"Bearer {VERCEL_TOKEN}"}
SITE_DIR = os.path.dirname(os.path.abspath(__file__))

DEMO_FILES = [
    "demo.html", "demo-v2.html", "demo-v3.html", "demo-v4.html", "demo-v5.html",
    "demo-v6.html", "demo-v7.html", "demo-v8.html", "demo-v9.html",
    "demo-redesign.html", "demo-scroll.html", "demo-scroll-page2.html",
    "index-v3.html", "index_backup.html",
]


def compute_files():
    """Only include the demo files above — never the client demo folders."""
    files = []
    for fn in DEMO_FILES:
        fpath = os.path.join(SITE_DIR, fn)
        if not os.path.exists(fpath):
            print(f"  (missing, skipped) {fn}")
            continue
        with open(fpath, "rb") as f:
            content = f.read()
        sha = hashlib.sha1(content).hexdigest()
        files.append({"file": fn, "sha": sha, "size": len(content)})
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prod", action="store_true", help="Alias to production")
    args = ap.parse_args()

    # Ensure project exists
    print("Ensuring project exists...")
    requests.post("https://api.vercel.com/v9/projects",
                  headers=HEADERS, json={"name": PROJECT, "framework": None}, timeout=10)

    files = compute_files()
    print(f"Found {len(files)} demo files")

    payload = {"name": PROJECT, "project": PROJECT, "files": files}
    if args.prod:
        payload["target"] = "production"
    resp = requests.post("https://api.vercel.com/v13/deployments", headers=HEADERS, json=payload, timeout=30)
    d = resp.json()

    error = d.get("error", {})
    if error.get("code") == "missing_files":
        missing = error["missing"]
        sha_map = {}
        for f in files:
            if f["sha"] in missing:
                fpath = os.path.join(SITE_DIR, f["file"])
                with open(fpath, "rb") as fh:
                    content = fh.read()
                sha_map[f["sha"]] = (f["file"], content)
        print(f"Uploading {len(missing)} missing files...")
        for sha, (fname, content) in sha_map.items():
            r = requests.post("https://api.vercel.com/v2/now/files",
                              headers={**HEADERS, "Content-Type": "application/octet-stream",
                                       "x-vercel-digest": sha},
                              data=content, timeout=60)
            if r.status_code not in (200, 201):
                print(f"  upload failed {fname}: {r.status_code} {r.text[:100]}")
        # retry deploy
        resp = requests.post("https://api.vercel.com/v13/deployments", headers=HEADERS, json=payload, timeout=30)
        d = resp.json()

    dep_id = d.get("id")
    if not dep_id:
        print("DEPLOY FAILED:", d)
        sys.exit(1)
    print(f"Deployment: {dep_id}")
    print(f"Waiting for ready...")
    for _ in range(30):
        r = requests.get(f"https://api.vercel.com/v13/deployments/{dep_id}", headers=HEADERS, timeout=15)
        st = r.json().get("status")
        print(f"  {st}", end=" " if st not in ("READY", "ERROR") else "\n")
        if st == "READY":
            break
        if st == "ERROR":
            print("DEPLOY ERROR")
            sys.exit(1)
        time.sleep(5)

    if args.prod:
        alias = f"{PROJECT}.vercel.app"
        requests.post(f"https://api.vercel.com/v10/projects/{PROJECT}/aliases",
                      headers=HEADERS, json={"alias": alias}, timeout=15)
        print(f"\n✅ Demo pages live at https://{alias}/demo.html etc.")
    else:
        print(f"\nPreview: https://{dep_id}.vercel.app")


if __name__ == "__main__":
    main()
