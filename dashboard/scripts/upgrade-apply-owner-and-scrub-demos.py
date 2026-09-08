#!/usr/bin/env python3
"""LLOS upgrade helper — apply ownerName from name_lookup results + scrub dead demoUrls.

Reads LIVE book via API, writes via Vercel Blob (BLOB_READ_WRITE_TOKEN from .env.local).
Never seeds from a thin local pipeline.json.

Usage:
  cd /mnt/d/LocalLaunch/dashboard
  python3 scripts/upgrade-apply-owner-and-scrub-demos.py --dry-run
  python3 scripts/upgrade-apply-owner-and-scrub-demos.py --apply
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
ENV_LOCAL = ROOT / ".env.local"
LIVE = "https://dashboard-eight-sage-89.vercel.app"
COOKIE = "ll_dash_auth=0613"
BLOB_PATHNAME = "pipeline.json"

DEAD_DEMO_NAMES = {
    "Lonts 24/7 Disposal",
    "Machado Handyman and HVAC Solutions",
    "Moriaan Construction Company LLC",
    "WipeOUT Junk Removal Miami",
    "Mishoe's Handy Services and Closing Contractor",
    "Haul Away LLC",
    "Spartan Concrete LLC",
    "S Pugh Plumbing LLC",
    "Uptown Renovations LLC",
    "Gulotta's Window Cleaning",
    "Royal Pro Wash",
    "Kirk Johnson Handyman Contractor",
    "Simpsonville Cleaning Authority",
}


def load_env():
    if not ENV_LOCAL.exists():
        raise SystemExit(f"missing {ENV_LOCAL}")
    for line in ENV_LOCAL.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def live_get() -> dict:
    req = urllib.request.Request(
        f"{LIVE}/api/pipeline/data",
        headers={"Cookie": COOKIE},
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r)


def load_name_lookups() -> dict[str, str]:
    """Map normalized business name OR email -> first_name."""
    out: dict[str, str] = {}
    files = list(DATA.glob("name_lookup_results*.json")) + list(
        DATA.glob("name_lookup_part*.json")
    ) + list(DATA.glob("name_lookup2_part*.json"))
    for p in files:
        try:
            rows = json.loads(p.read_text())
        except Exception:
            continue
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            fn = (row.get("first_name") or "").strip()
            if not fn or fn.lower() in {"null", "none", "unknown"}:
                continue
            # title-case lightly
            fn = fn.split()[0]
            name = (row.get("name") or "").strip().lower()
            email = (row.get("email") or "").strip().lower()
            if name:
                out[f"n:{name}"] = fn
            if email:
                out[f"e:{email}"] = fn
    return out


def curl_code(url: str) -> str:
    try:
        return subprocess.check_output(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-m", "10", "-L", url],
            text=True,
        ).strip()
    except Exception:
        return "err"


def write_blob(data: dict, token: str) -> None:
    # Use @vercel/blob via node for correct private put+overwrite semantics
    payload_path = Path("/tmp/llos-upgrade-pipeline.json")
    payload_path.write_text(json.dumps(data))
    script = f"""
const fs = require('fs');
const {{ put }} = require('@vercel/blob');
(async () => {{
  const body = fs.readFileSync({json.dumps(str(payload_path))});
  const res = await put({json.dumps(BLOB_PATHNAME)}, body, {{
    access: 'private',
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  }});
  console.log(JSON.stringify({{ ok: true, url: res.url, pathname: res.pathname }}));
}})().catch(e => {{ console.error(e); process.exit(1); }});
"""
    env = os.environ.copy()
    env["BLOB_READ_WRITE_TOKEN"] = token
    # run from dashboard so node_modules resolves
    r = subprocess.run(
        ["node", "-e", script],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise SystemExit(f"blob write failed: {r.stderr or r.stdout}")
    print(r.stdout.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true", default=True)
    ap.add_argument("--rescrub-check", action="store_true", help="curl every demoUrl")
    args = ap.parse_args()
    if args.apply:
        args.dry_run = False

    load_env()
    token = os.environ.get("BLOB_READ_WRITE_TOKEN")
    if not token:
        raise SystemExit("BLOB_READ_WRITE_TOKEN missing")

    live = live_get()
    companies = live.get("companies") or []
    print(f"live companies={len(companies)} demos={sum(1 for c in companies if c.get('demoUrl'))}")
    if len(companies) < 200:
        raise SystemExit("REFUSING: live book too small — abort")

    names = load_name_lookups()
    print(f"name lookup keys={len(names)}")

    owner_applied = 0
    demos_cleared = []
    today = time.strftime("%Y-%m-%d")

    # optional full re-curl
    dead_urls = set()
    if args.rescrub_check:
        for c in companies:
            u = c.get("demoUrl")
            if not u:
                continue
            code = curl_code(u)
            if code != "200":
                dead_urls.add(u)
                print(f"  dead {code} {c.get('name')} {u}")

    for c in companies:
        # ownerName
        if not c.get("ownerName"):
            nkey = f"n:{(c.get('name') or '').strip().lower()}"
            ekey = f"e:{(c.get('email') or '').strip().lower()}"
            fn = names.get(nkey) or names.get(ekey)
            if fn:
                c["ownerName"] = fn
                owner_applied += 1

        # scrub known-dead or rechecked-dead demoUrls
        u = c.get("demoUrl")
        name = c.get("name") or ""
        if u and (name in DEAD_DEMO_NAMES or u in dead_urls):
            demos_cleared.append((name, u))
            c["demoUrl"] = ""
            # also clear nested demo.url if present
            if isinstance(c.get("demo"), dict) and c["demo"].get("url"):
                c["demo"]["url"] = ""
                c["demo"]["status"] = c["demo"].get("status") or "rework"
            c["lastUpdated"] = today

    print(f"ownerName to apply: {owner_applied}")
    print(f"dead demos to clear: {len(demos_cleared)}")
    for row in demos_cleared:
        print("  clear", row)

    # rebuild full pipeline shape for Blob
    # Live API is flatter; Blob/readPipelineSafe expects companies array at top.
    # Preserve whatever live returned + keep companies updated.
    out = dict(live)
    out["companies"] = companies

    # also write local snapshot for safety (not the thin gitignored drift file blindly)
    bak = DATA / f"pipeline.live-upgrade-backup-{today}.json"
    bak.write_text(json.dumps(live, indent=2))
    print(f"backup -> {bak}")

    if args.dry_run:
        print("DRY RUN — no Blob write. Re-run with --apply to commit.")
        return

    # write local pipeline.json as the reconciled live book too
    (DATA / "pipeline.json").write_text(json.dumps(out, indent=2))
    write_blob(out, token)
    print("Blob write OK. Waiting 15s for propagation…")
    time.sleep(15)
    live2 = live_get()
    cs2 = live2.get("companies") or []
    print(
        f"verify companies={len(cs2)} demos={sum(1 for c in cs2 if c.get('demoUrl'))} "
        f"ownerName={sum(1 for c in cs2 if c.get('ownerName'))}"
    )
    still = [c.get("name") for c in cs2 if (c.get("name") in DEAD_DEMO_NAMES and c.get("demoUrl"))]
    print("still-dead-with-url", still)


if __name__ == "__main__":
    main()
