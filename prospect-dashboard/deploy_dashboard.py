#!/usr/bin/env python3
"""Deploy the prospect dashboard (phone.html) to Vercel as a static site.

Creates/updates a Vercel project 'local-launch-prospects' and deploys
phone.html as index.html. Uses the REST API with the two-phase pattern
(deploy -> upload missing -> retry) that works reliably on WSL.

Usage: python3 deploy_dashboard.py [--prod]
"""
import json, os, sys, time, hashlib, argparse, requests

TOKEN = json.load(open(os.path.expanduser("~/.vercel/auth.json")))["token"]
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
ORG = "team_YO9ejaSYwJfl7gQ7G4blqD9u"
PROJECT = "local-launch-prospects"
BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "phone.html")


def create_project():
    r = requests.post(
        f"https://api.vercel.com/v10/projects?teamId={ORG}",
        headers=HEADERS,
        json={"name": PROJECT, "framework": None},
        timeout=30,
    )
    if r.status_code in (200, 201):
        print("project ready:", r.json().get("name"))
    elif r.status_code == 409:
        print("project already exists")
    else:
        print("project create warn:", r.status_code, r.text[:200])


def make_files():
    content = open(SRC, "rb").read()
    sha = hashlib.sha1(content).hexdigest()
    return [{"file": "index.html", "sha": sha, "size": len(content)}], content


def create_deployment(files_array, target):
    payload = {
        "name": PROJECT,
        "project": PROJECT,
        "files": files_array,
        "target": target,
    }
    r = requests.post(
        f"https://api.vercel.com/v13/deployments?teamId={ORG}",
        headers=HEADERS,
        json=payload,
        timeout=60,
    )
    return r


def upload_missing(files_array, content):
    payload = {
        "name": PROJECT,
        "project": PROJECT,
        "target": "production",
        "files": files_array,
    }
    resp = requests.post(
        f"https://api.vercel.com/v13/deployments?teamId={ORG}",
        headers=HEADERS, json=payload, timeout=60,
    )
    d = resp.json()
    error = d.get("error", {})
    if error.get("code") != "missing_files":
        if error:
            raise RuntimeError(f"Deployment creation failed: {error.get('message', error)}")
        return d

    missing = error.get("missing", [])
    print(f"uploading {len(missing)} file(s)...")
    for sha in missing:
        r2 = requests.post(
            "https://api.vercel.com/v2/now/files",
            headers={**HEADERS, "Content-Type": "application/octet-stream", "x-vercel-digest": sha},
            data=content,
            timeout=30,
        )
        if r2.status_code in (200, 201):
            print("  uploaded OK")
        else:
            print("  upload FAILED:", r2.status_code, r2.text[:200])
            return None

    resp3 = requests.post(
        f"https://api.vercel.com/v13/deployments?teamId={ORG}",
        headers=HEADERS, json=payload, timeout=60,
    )
    d3 = resp3.json()
    if d3.get("error"):
        raise RuntimeError(f"Deploy after upload failed: {d3['error'].get('message', d3['error'])}")
    return d3


def wait_ready(dep_id):
    for _ in range(40):
        r = requests.get(
            f"https://api.vercel.com/v13/deployments/{dep_id}?teamId={ORG}",
            headers=HEADERS, timeout=30,
        )
        state = r.json().get("status")
        if state == "READY":
            url = r.json().get("url")
            print(f"READY: https://{url}")
            if "--prod" in sys.argv:
                print(f"PROD: https://{PROJECT}.vercel.app")
            return url
        if state in ("ERROR", "CANCELED"):
            print("deploy state:", state)
            return None
        time.sleep(3)
    print("timeout waiting for ready")
    return None


if __name__ == "__main__":
    create_project()
    files_array, content = make_files()
    target = "production" if "--prod" in sys.argv else None
    dep = upload_missing(files_array, content)
    if dep and dep.get("id"):
        wait_ready(dep["id"])
    else:
        print("deployment object missing id:", json.dumps(dep)[:300] if dep else "None")
