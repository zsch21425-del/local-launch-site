#!/usr/bin/env python3
"""Redeploy the 19 mechanical-only demos (footer/emoji/placeholder already fixed in source)."""
import json, os, subprocess, re

qa = json.load(open("/mnt/d/LocalLaunch/dashboard/data/demo-qa.json"))
dirty = qa["dirty"]
my_urls = []
for r in dirty:
    if r.get("error"):
        continue
    issues = r.get("issues", [])
    has_phone = any(i.startswith("PHONE") for i in issues)
    has_fab = any(("family-run" in i or "years of experience" in i or "over a decade" in i or "since 19" in i or "since 20" in i) for i in issues)
    if not has_phone and not has_fab:
        my_urls.append(r["url"])

base = "/mnt/d/LocalLaunch/demos"
proj2folder = {}
for d in sorted(os.listdir(base)):
    dp = os.path.join(base, d, "deploy.py")
    if os.path.exists(dp):
        try:
            m = re.search(r'PROJECT\s*=\s*["\']([^"\']+)["\']', open(dp).read())
            if m:
                proj2folder[m.group(1)] = d
        except Exception:
            pass

results = []
for url in my_urls:
    slug = url.replace("https://", "").split(".")[0]
    folder = proj2folder.get(slug)
    if not folder:
        results.append((slug, "NO-FOLDER"))
        continue
    try:
        r = subprocess.run(["python3", "deploy.py"], cwd=os.path.join(base, folder),
                           capture_output=True, text=True, timeout=150)
        last = ([l for l in (r.stdout or "").splitlines() if l.strip()] or ["(no output)"])[-1]
        ok = "Live:" in last or "Aliased" in last or "Ready" in last or "Deployed" in last
        results.append((slug, "OK" if ok else f"CHECK: {last[:80]}"))
    except Exception as e:
        results.append((slug, f"ERR: {type(e).__name__}"))

print(f"=== redeploy results ({len(results)} demos) ===")
for slug, status in results:
    print(f"  {status:12} {slug}")
ok = sum(1 for _, s in results if s == "OK")
print(f"\n{ok}/{len(results)} redeployed OK")
