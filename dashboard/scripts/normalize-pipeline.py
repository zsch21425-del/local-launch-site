#!/usr/bin/env python3
"""Normalize pipeline.json priority + pitchDraft.status values to canonical sets.
Preserves all other fields. Safe: only touches `priority` and `pitchDraft.status`."""
import json, os, re

P = "data/pipeline.json"
d = json.load(open(P))
companies = d["companies"]

# Canonical priority map (lowercase-keyed)
PRIORITY_MAP = {
    "high": "high",
    "h": "high",
    "hi": "high",
    "urgent": "high",
    "critical": "high",
    "broken-site": "high",
    "high (broken-site pattern)": "high",
    "medium-high": "medium-high",
    "med-high": "medium-high",
    "medium high": "medium-high",
    "medhigh": "medium-high",
    "mh": "medium-high",
    "medium": "medium",
    "med": "medium",
    "m": "medium",
    "low-medium": "low",
    "lowmedium": "low",
    "low": "low",
    "l": "low",
    "lo": "low",
}
# Anything unmapped -> keep as-is but lowercase for stability (or default medium)
DEFAULT_PRIORITY = "medium"

STATUS_MAP = {
    "pending": "pending-review",
    "pending-review": "pending-review",
    "pending review": "pending-review",
    "pending supervisor review": "pending-supervisor-review",
    "pending-supervisor-review": "pending-supervisor-review",
    "supervisor-approved": "supervisor-approved",
    "zach-approved": "zach-approved",
    "sent": "sent",
    "rejected": "rejected",
    "rework": "rework",
}

pc = 0
sc = 0
for c in companies:
    # Priority
    raw = (c.get("priority") or "").strip()
    key = raw.lower()
    if key in PRIORITY_MAP:
        norm = PRIORITY_MAP[key]
    else:
        # try to extract a known token
        norm = DEFAULT_PRIORITY
    if norm != raw:
        pc += 1
    c["priority"] = norm

    # pitchDraft.status
    pd = c.get("pitchDraft")
    if isinstance(pd, dict) and pd.get("status"):
        sraw = str(pd["status"]).strip()
        sk = sraw.lower()
        if sk in STATUS_MAP:
            snorm = STATUS_MAP[sk]
        else:
            snorm = sraw  # leave unknown as-is
        if snorm != sraw:
            sc += 1
        pd["status"] = snorm

json.dump(d, open(P, "w"), indent=2)
print(f"Normalized priorities on {pc} companies, pitch statuses on {sc} companies.")
from collections import Counter
print("priority now:", dict(Counter(c["priority"] for c in companies)))
print("pitchDraft.status now:", dict(Counter((c.get('pitchDraft') or {}).get('status') for c in companies if c.get('pitchDraft'))))
