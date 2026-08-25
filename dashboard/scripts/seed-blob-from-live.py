#!/usr/bin/env python3
"""Phase 1 / Step 1 — Seed Vercel Blob from the LIVE 264-company API.

OFFICE MACHINE ONLY — emergency tool. The companion routes /api/seed-blob and
/api/probe-write were deleted after the Phase 1 proof; this script is the safe
way to re-seed Blob if it ever ends up at 51/0. Run from Zach's office machine
(WSL) where /tmp + BLOB access are valid. Do NOT run blindly — the live count
must be verified 264 before this overwrites Blob.

Thin client. The actual work happens server-side in
src/app/api/seed-blob/route.ts so we use the EXACT same readPipeline/writePipeline
the production app uses (no module-resolution risk).

NOTE: /api/seed-blob is DELETED from prod (Phase 1 closure). To use this script
again as an emergency tool, first re-add that route (git-recover it), deploy, run,
then re-delete. Never leave the seed endpoint live.

RULES (from PHASE-1-LIVE-DATA-PLANE.md):
  - Source of truth: GET /api/pipeline/data with Cookie: ll_dash_auth=0613.
  - Refuse unless live companies == 264 and demoUrl count == 31.
  - Back up current Blob to /tmp/blob-backup-YYYYMMDD.json.
  - Verify Blob has 264 / 31 after write.
"""
import json, sys, urllib.request
from pathlib import Path

URL = "https://dashboard-eight-sage-89.vercel.app/api/pipeline/data"
SEED_ROUTE = "https://dashboard-eight-sage-89.vercel.app/api/seed-blob"
COOKIE = "ll_dash_auth=0613"
LIVE_FILE = Path("/tmp/llos-live.json")


def call(url, data=None, method=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(
        url,
        data=body,
        method=method or ("POST" if data is not None else "GET"),
        headers={"Cookie": COOKIE, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


# --- 1. Re-fetch live so this run's truth is current.
print("[1/4] Fetching live /api/pipeline/data ...")
code, live = call(URL)
if code != 200:
    print(f"FATAL: live fetch http={code}", file=sys.stderr)
    sys.exit(1)
cos = live.get("companies", [])
n_live, n_demo = len(cos), sum(1 for x in cos if x.get("demoUrl"))
print(f"     live: companies={n_live} demoUrl={n_demo} keys={sorted(live.keys())}")
if n_live != 264 or n_demo != 31:
    print(f"FATAL: live must be 264/31, got {n_live}/{n_demo}", file=sys.stderr)
    sys.exit(1)
LIVE_FILE.write_text(json.dumps(live))
print(f"     cached live snapshot: {LIVE_FILE} ({LIVE_FILE.stat().st_size} bytes)")

# --- 2. GET seed route (status).
print("[2/4] GET /api/seed-blob (status) ...")
code, status = call(SEED_ROUTE)
print(f"     http={code} env={status.get('env')} blob_companies={status.get('blob_companies')} blob_demos={status.get('blob_demos')}")

# --- 3. POST snapshot inline (serverless /tmp is per-instance, can't read local path).
print("[3/4] POST /api/seed-blob (seed + verify, snapshot inline) ...")
code, rep = call(SEED_ROUTE, {"snapshot": live})
print(json.dumps(rep, indent=2))
if code != 200 or not rep.get("ok"):
    print(f"FATAL: seed route failed http={code}", file=sys.stderr)
    sys.exit(1)

# --- 4. Independent re-check.
print("[4/4] GET /api/seed-blob (post-seed status) ...")
code, after = call(SEED_ROUTE)
print(f"     http={code} blob_companies={after.get('blob_companies')} blob_demos={after.get('blob_demos')}")
if after.get("blob_companies") != 264 or after.get("blob_demos") != 31:
    print(f"FATAL: post-seed Blob != 264/31, got {after.get('blob_companies')}/{after.get('blob_demos')}", file=sys.stderr)
    sys.exit(1)
print("SEED_OK")
