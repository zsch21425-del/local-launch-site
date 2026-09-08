#!/usr/bin/env python3
"""Send-truth audit: reconcile locallaunch Sent + bounces → live pipeline Blob."""
from __future__ import annotations

import json
import os
import re
import subprocess
import time
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path("/mnt/d/LocalLaunch/dashboard")
DATA = ROOT / "data"
TODAY = time.strftime("%Y-%m-%d")


def load_env():
    env = ROOT / ".env.local"
    for line in env.read_text().splitlines():
        if not line.strip() or line.strip().startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def live_get():
    req = urllib.request.Request(
        "https://dashboard-eight-sage-89.vercel.app/api/pipeline/data",
        headers={"Cookie": "ll_dash_auth=0613"},
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r)


def write_blob(data: dict):
    payload = Path("/tmp/send_truth_book.json")
    payload.write_text(json.dumps(data))
    token = os.environ["BLOB_READ_WRITE_TOKEN"]
    script = f"""
const fs = require('fs');
const {{ put }} = require('@vercel/blob');
(async () => {{
  const body = fs.readFileSync({json.dumps(str(payload))});
  const res = await put('pipeline.json', body, {{
    access: 'private', allowOverwrite: true, token: process.env.BLOB_READ_WRITE_TOKEN
  }});
  console.log(JSON.stringify({{ ok: true, pathname: res.pathname }}));
}})().catch(e => {{ console.error(e); process.exit(1); }});
"""
    env = os.environ.copy()
    env["BLOB_READ_WRITE_TOKEN"] = token
    r = subprocess.run(
        ["node", "-e", script], cwd=str(ROOT), env=env, capture_output=True, text=True
    )
    if r.returncode != 0:
        raise SystemExit(f"blob write failed: {r.stderr or r.stdout}")
    print(r.stdout.strip())


def company_emails(c):
    out = []
    if c.get("email"):
        out.append(str(c["email"]).lower().strip())
    pd = c.get("pitchDraft")
    if isinstance(pd, dict) and pd.get("email"):
        out.append(str(pd["email"]).lower().strip())
    return [e for e in out if e and "@" in e]


def ensure_pd(c):
    if not isinstance(c.get("pitchDraft"), dict):
        c["pitchDraft"] = {
            "body": "",
            "channel": "email",
            "status": None,
            "confidence": 0,
        }
    return c["pitchDraft"]


def mx_ok(email: str) -> bool:
    try:
        domain = email.split("@", 1)[1].lower()
    except Exception:
        return False
    free = {
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "icloud.com",
        "aol.com",
        "comcast.net",
        "bellsouth.net",
        "att.net",
        "msn.com",
        "live.com",
        "me.com",
        "protonmail.com",
        "ymail.com",
        "yahoo.co.uk",
        "charter.net",
        "cox.net",
        "sbcglobal.net",
        "verizon.net",
    }
    if domain in free:
        return True
    # dig may be missing on this host — try host/getent, then python socket
    for cmd in (
        ["host", "-t", "MX", domain],
        ["nslookup", "-type=MX", domain],
    ):
        try:
            p = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            out = (p.stdout or "") + (p.stderr or "")
            if "mail is handled" in out.lower() or "mx" in out.lower() and "nxdomain" not in out.lower():
                if "nxdomain" in out.lower() or "not found" in out.lower():
                    break
                if re.search(r"\d+\s+\S+\.", out) or "mail is handled" in out.lower():
                    return True
        except FileNotFoundError:
            continue
    try:
        import socket

        socket.getaddrinfo(domain, None)
        return True
    except Exception:
        return False


def add_note(c, note: str):
    ns = c.get("nextSteps")
    if isinstance(ns, list):
        if not any(note[:20] in str(x) for x in ns):
            ns.insert(0, note)
    elif isinstance(ns, str) and ns.strip():
        c["nextSteps"] = [note, ns]
    else:
        c["nextSteps"] = [note]


def main():
    load_env()
    live = live_get()
    cs = live["companies"]
    print("live", len(cs))

    sent = json.loads(Path("/tmp/ll_sent_unique.json").read_text())
    email_to_sent = defaultdict(list)
    sent_emails = set()
    for s in sent:
        for e in s.get("emails") or []:
            el = e.lower().strip()
            if "locallaunch" in el or el.endswith("@txt.att.net"):
                continue
            sent_emails.add(el)
            email_to_sent[el].append(s)
    print("unique sent recipient emails", len(sent_emails))

    by_email = defaultdict(list)
    for c in cs:
        for e in company_emails(c):
            by_email[e].append(c["id"])

    matched_ids = set()
    matched_email_map = {}
    for e in sent_emails:
        ids = list(by_email.get(e) or [])
        if not ids:
            local = e.split("@")[0]
            for c in cs:
                for ce in company_emails(c):
                    if ce.split("@")[0] == local:
                        ids.append(c["id"])
        for i in ids:
            matched_ids.add(i)
            matched_email_map[i] = e
    print("pipeline matched to sent", len(matched_ids))

    bounce_emails = {
        "pdesmond@spartanpaversealing.com",
        "tonygatto@charter.net",
        "brandon@concrete-anderson.com",
    }
    if Path("/tmp/ll_bounces.json").exists():
        for b in json.loads(Path("/tmp/ll_bounces.json").read_text()):
            for e in b.get("emails") or []:
                bounce_emails.add(e.lower())

    changes = []
    for c in cs:
        cid = c["id"]
        emails = company_emails(c)
        pd = c.get("pitchDraft") if isinstance(c.get("pitchDraft"), dict) else None
        bounced = any(e in bounce_emails for e in emails)
        verified = cid in matched_ids
        was_contacted = c.get("stage") == "contacted"
        was_sent = isinstance(pd, dict) and pd.get("status") == "sent"

        if bounced:
            pd = ensure_pd(c)
            old = (c.get("stage"), pd.get("status"), c.get("responseStatus"))
            c["responseStatus"] = "bounced"
            pd["status"] = "bounced"
            for e in list(emails):
                if e in bounce_emails and (c.get("email") or "").lower() == e:
                    c["emailDead"] = c.get("email")
                    c["email"] = ""
            if c.get("stage") == "contacted":
                c["stage"] = "pitch"
            c["sendTruth"] = {
                "status": "bounced",
                "auditedAt": TODAY,
                "note": "Hard bounce / dead mailbox. Phone-only until new email.",
            }
            c["lastUpdated"] = TODAY
            add_note(
                c,
                f"SEND-TRUTH {TODAY}: hard bounce. Treat phone-only until new email verified.",
            )
            changes.append({"id": cid, "action": "BOUNCED", "old": old, "emails": emails})
            continue

        if verified:
            pd = ensure_pd(c)
            old = (c.get("stage"), pd.get("status"), c.get("responseStatus"))
            pd["status"] = "sent"
            e = matched_email_map.get(cid)
            dates = email_to_sent.get(e or [], [])
            if dates and not pd.get("sentDate"):
                d0 = str(dates[0].get("date") or "")
                # normalize date fragment
                m = re.search(r"\d{4}-\d{2}-\d{2}", d0)
                if m:
                    pd["sentDate"] = m.group(0)
            if c.get("stage") not in ("build-launch", "sale", "response"):
                if c.get("stage") in ("pitch", "prospect", "audit", None, ""):
                    c["stage"] = "contacted"
            if not c.get("responseStatus"):
                c["responseStatus"] = "awaiting"
            # domain risk?
            status = "sent_unverified"
            note = "In locallaunch Sent (deduped). No bounce DSN found — not proof of inbox delivery."
            if e and not mx_ok(e):
                status = "sent_domain_risk"
                note = "In Sent but domain has no MX/A — high undeliverable risk."
                c["responseStatus"] = "bounce-risk"
            c["sendTruth"] = {
                "status": status,
                "matchedEmail": e,
                "auditedAt": TODAY,
                "note": note,
            }
            c["lastUpdated"] = TODAY
            changes.append(
                {
                    "id": cid,
                    "action": "VERIFIED_SENT" if status == "sent_unverified" else "DOMAIN_RISK",
                    "old": old,
                    "email": e,
                }
            )
            continue

        if was_contacted or was_sent:
            pd = ensure_pd(c)
            old = (
                c.get("stage"),
                pd.get("status"),
                c.get("responseStatus"),
                c.get("lastContact"),
            )
            if c.get("stage") == "contacted":
                c["stage"] = "pitch"
            if pd.get("status") == "sent":
                # keep history but don't claim sent
                pd["status"] = "unproven-send"
            if c.get("responseStatus") in ("awaiting", "sent", "pitch-sent"):
                c["responseStatus"] = None
            c["sendTruth"] = {
                "status": "unproven",
                "auditedAt": TODAY,
                "note": "Marked contacted/sent but no matching To: in locallaunch Sent. Cleared optimistic flags.",
            }
            c["lastUpdated"] = TODAY
            add_note(
                c,
                f"SEND-TRUTH {TODAY}: unproven send — cleared contacted/sent (not matched in Sent).",
            )
            changes.append(
                {"id": cid, "action": "UNPROVEN_CLEARED", "old": old, "emails": emails}
            )

    print("=== CHANGES ===")
    print(Counter(ch["action"] for ch in changes))
    print("total", len(changes))
    print("stages", Counter(c.get("stage") for c in cs))
    print(
        "sendTruth",
        Counter((c.get("sendTruth") or {}).get("status", "none") for c in cs),
    )
    print(
        "responseStatus",
        Counter(c.get("responseStatus") or "NONE" for c in cs),
    )
    pst = Counter()
    for c in cs:
        pd = c.get("pitchDraft")
        pst[pd.get("status") if isinstance(pd, dict) else None] += 1
    print("pitchStatus", pst)

    # backups + write
    backup = DATA / f"pipeline.send-truth-backup-{TODAY}.json"
    backup.write_text(json.dumps(live, indent=2))
    out = dict(live)
    out["companies"] = cs
    # audit meta
    out["sendTruthAudit"] = {
        "auditedAt": TODAY,
        "uniqueSentEmails": len(sent_emails),
        "matchedCompanies": len(matched_ids),
        "changes": len(changes),
        "counts": dict(Counter(ch["action"] for ch in changes)),
        "definitions": {
            "sent_unverified": "In Sent folder; no bounce DSN — not guaranteed inbox delivery",
            "sent_domain_risk": "In Sent but domain MX/A missing",
            "bounced": "Hard bounce DSN or known dead mailbox",
            "unproven": "Was labeled sent/contacted without Sent match — flags cleared",
        },
    }
    (DATA / "pipeline.json").write_text(json.dumps(out, indent=2))
    Path("/tmp/send_truth_changes.json").write_text(json.dumps(changes, indent=2))
    write_blob(out)
    print("backup", backup)
    print("blob write ok — waiting 20s")
    time.sleep(20)
    live2 = live_get()
    cs2 = live2["companies"]
    print(
        "verify stages",
        Counter(c.get("stage") for c in cs2),
    )
    print(
        "verify sendTruth",
        Counter((c.get("sendTruth") or {}).get("status", "none") for c in cs2),
    )
    print(
        "contacted",
        sum(1 for c in cs2 if c.get("stage") == "contacted"),
        "bounced rs",
        sum(1 for c in cs2 if c.get("responseStatus") == "bounced"),
    )


if __name__ == "__main__":
    main()
