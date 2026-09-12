#!/usr/bin/env python3
"""Deterministic pricing fix on the local full snapshot (no blob reads).
$300 -> $599, $49 -> $149. Collects banned-close + $90-audit pitches for subagent rewrite."""
import json, re, os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "scripts")
# scripts/ is where we are writing; but pipeline_full_snapshot.json is in dashboard/scripts/
# This file lives in dashboard/scripts/, so BASE is dashboard/
BASE = os.path.dirname(os.path.abspath(__file__))

data = json.load(open(os.path.join(BASE, "pipeline_full_snapshot.json")))
companies = data["companies"]

pricing_fixed = 0
needs_rewrite = []

for c in companies:
    body = (c.get("pitchDraft") or {}).get("body")
    if not isinstance(body, str) or not body:
        continue
    new = body
    changed = False
    if re.search(r"\$300\b", new):
        new = re.sub(r"\$300\b", "$599", new); changed = True
    if re.search(r"\$49\b", new):
        new = re.sub(r"\$49\b", "$149", new); changed = True
    if changed:
        c["pitchDraft"]["body"] = new
        pricing_fixed += 1
    # natural-rewrite candidates
    flags = []
    if re.search(r"i look forward to hearing from you", new, re.I):
        flags.append("banned-close")
    if re.search(r"\$90\b", new):
        flags.append("$90-audit")
    if flags:
        needs_rewrite.append({"id": c["id"], "name": c.get("name"), "body": new, "flags": flags})

print("pricing fixed:", pricing_fixed)
print("needs natural rewrite:", len(needs_rewrite))

json.dump(data, open(os.path.join(BASE, "pipeline_pricing_fixed.json"), "w"), indent=2)
json.dump(needs_rewrite, open(os.path.join(BASE, "close_rewrites.json"), "w"), indent=2)

# breakdown
from collections import Counter
bc = Counter()
for e in needs_rewrite:
    for f in e["flags"]:
        bc[f] += 1
print("flag breakdown:", dict(bc))
print("ids needing rewrite:")
for e in needs_rewrite:
    print(" ", e["id"], e["flags"])
