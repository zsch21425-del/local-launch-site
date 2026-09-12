#!/usr/bin/env python3
"""Apply corrected migration v2 to the pricing-fixed snapshot → pipeline_migrated.json."""
import json, os, collections

BASE = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(BASE, "pipeline_final.json")))
comps = data["companies"]

REAL_CLIENTS = {"redwood", "cc-headlight", "mom-and-mop"}

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
            target = "prospect"
    elif original == "contacted":
        target = "outreach"
    elif original == "approval":
        target = "approval"
    elif original == "build-launch":
        if c["id"] in REAL_CLIENTS:
            target = "sale"
        elif ps == "sent":
            target = "outreach"
        else:
            target = "prospect"
    if target != original:
        c["stage"] = target

data["stageMigrationVersion"] = 2

# Rewrite the stages array to the correct 7-stage funnel + terminal clients stage.
# (The in-memory migrator used to do this; now that it no-ops on v2, persist it.)
data["stages"] = [
    {"id": "prospect", "label": "Prospects", "icon": "Search", "color": "slate"},
    {"id": "audit", "label": "Audit", "icon": "Clipboard", "color": "blue"},
    {"id": "pitch", "label": "Pitch", "icon": "Megaphone", "color": "amber"},
    {"id": "quality-check", "label": "Quality check", "icon": "ShieldCheck", "color": "violet"},
    {"id": "approval", "label": "Approval", "icon": "ClipboardCheck", "color": "sky"},
    {"id": "outreach", "label": "Outreach", "icon": "Send", "color": "emerald"},
    {"id": "follow-up", "label": "Follow up", "icon": "RefreshCw", "color": "orange"},
    {"id": "sale", "label": "Clients", "icon": "Trophy", "color": "green"},
]

json.dump(data, open(os.path.join(BASE, "pipeline_migrated.json"), "w"), indent=2)
print("WROTE pipeline_migrated.json")
print("distribution:", dict(collections.Counter(c["stage"] for c in comps)))
