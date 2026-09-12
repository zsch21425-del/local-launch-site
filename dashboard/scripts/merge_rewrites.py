#!/usr/bin/env python3
"""Merge subagent rewrite outputs back into pipeline_pricing_fixed.json,
then write the result to the Vercel Blob (via node @vercel/blob put).
Verifies no dead pricing / banned close / $90 remains across the whole book."""
import json, os, re, subprocess, sys

BASE = os.path.dirname(os.path.abspath(__file__))  # dashboard/scripts/
data = json.load(open(os.path.join(BASE, "pipeline_pricing_fixed.json")))

# Build rewrite map from the 3 slice outputs
rewrites = {}
for i in range(3):
    for e in json.load(open(os.path.join(BASE, f"rewrite_slice_{i}_out.json"))):
        rewrites[e["id"]] = e["body"]

applied = 0
for c in data["companies"]:
    if c["id"] in rewrites:
        c["pitchDraft"]["body"] = rewrites[c["id"]]
        applied += 1

print("rewrites applied:", applied)

# Final verification across the whole book
bad = []
for c in data["companies"]:
    b = (c.get("pitchDraft") or {}).get("body") or ""
    if re.search(r"i look forward to hearing from you", b, re.I):
        bad.append((c["id"], "banned-close"))
    if re.search(r"\$90\b", b):
        bad.append((c["id"], "$90"))
    if re.search(r"\$300\b", b):
        bad.append((c["id"], "$300"))
    if re.search(r"\$49\b", b):
        bad.append((c["id"], "$49"))

print("remaining dead pricing/banned-close:", len(bad))
if bad:
    for x in bad[:30]:
        print("  ", x)
    sys.exit("ABORT — dead pricing/banned close remain")

# Save the final merged book locally
json.dump(data, open(os.path.join(BASE, "pipeline_final.json"), "w"), indent=2)
print("WROTE pipeline_final.json with", len(data["companies"]), "companies")
