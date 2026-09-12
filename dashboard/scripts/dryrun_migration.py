#!/usr/bin/env python3
"""Dry-run migration v2 — corrected per Zach's model:
7-stage funnel (prospect → audit → pitch → quality-check → approval → outreach → follow-up),
then a terminal "clients" stage (the 3 finished clients, monthly SEO audits).
Audit = info gathering complete. Pitch = demo + pitch together."""
import json, os, collections

BASE = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(BASE, "pipeline_final.json")))
comps = data["companies"]

# The 3 finished clients → terminal "sale" (Won/Clients) stage.
REAL_CLIENTS = {"redwood", "cc-headlight", "mom-and-mop"}

before = collections.Counter(c.get("stage") for c in comps)
print("=== BEFORE (legacy) ===")
for s, n in before.most_common():
    print(f"  {s}: {n}")

moved = collections.Counter()
new_dist = collections.Counter()
unmapped = []

for c in comps:
    original = c.get("stage")
    ps = (c.get("pitchDraft") or {}).get("status")
    target = original

    if original == "prospect":
        target = "prospect"
    elif original == "audit":
        target = "audit"
    elif original == "pitch":
        if ps == "supervisor-approved":
            target = "approval"
        elif ps in ("pending-supervisor-review", "unproven-send"):
            target = "quality-check"
        elif ps == "bounced":
            target = "outreach"
        elif ps in ("pending-review", None):
            target = "prospect"
        else:
            unmapped.append((c["id"], "pitch/" + str(ps)))
            target = "prospect"
    elif original == "contacted":
        target = "outreach"
    elif original == "approval":
        target = "approval"
    elif original == "build-launch":
        # Terminal clients stage = the 3 finished (Won). Others: sent → outreach,
        # nothing → prospect.
        if c["id"] in REAL_CLIENTS:
            target = "sale"  # Won / Clients (monthly SEO audits)
        elif ps == "sent":
            target = "outreach"
        else:
            target = "prospect"
    else:
        unmapped.append((c["id"], original))

    if target != original:
        moved[(original, target)] += 1
    new_dist[target] += 1

print()
print("=== AFTER (correct funnel + clients) ===")
for s, n in new_dist.most_common():
    print(f"  {s}: {n}")

print()
print("=== MOVEMENT ===")
for (a, b), n in sorted(moved.items()):
    print(f"  {a} -> {b}: {n}")

if unmapped:
    print()
    print("=== UNMAPPED (flagged) ===")
    for x in unmapped:
        print("  ", x)

print()
print("total:", len(comps), "| sum AFTER:", sum(new_dist.values()))
