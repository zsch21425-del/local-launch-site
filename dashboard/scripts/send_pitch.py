#!/usr/bin/env python3
"""send_pitch.py — HARD gate then himalaya send (-a locallaunch both sides).

INVALID → never send
VALID   → send
UNKNOWN → send with warning unless --strict
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from verify_email import verify

FROM = "Local Launch Upstate <locallaunchupstate@gmail.com>"


def _has_header_newline(value: str) -> bool:
    """Header-injection guard: a CR or LF (raw or escaped) in a header value
    lets a caller smuggle extra headers / a new body."""
    return any(ch in value for ch in ("\r", "\n")) or "\\r" in value or "\\n" in value


def send(email: str, subject: str, body_path: str):
    with open(body_path) as f:
        body = f.read().rstrip() + "\n"

    # Never let header data reach a shell, and never share a fixed temp path.
    if _has_header_newline(email) or _has_header_newline(subject):
        return 1, "blocked: CR/LF in To/Subject header (injection attempt)"

    # -a locallaunch on BOTH — never omit. subprocess arg ARRAYS, no shell=True,
    # no string interpolation of recipient/subject into a command line. Body is
    # streamed in-memory over stdin (no /tmp file).
    write_cmd = [
        "himalaya", "template", "write", "-a", "locallaunch",
        "-H", f"To:{email}",
        "-H", f"Subject:{subject}",
        "-H", f"From:{FROM}",
    ]
    w = subprocess.run(
        write_cmd, input=body, capture_output=True, text=True, timeout=60
    )
    if w.returncode != 0:
        return w.returncode, (w.stdout + w.stderr).strip()

    send_cmd = ["himalaya", "template", "send", "-a", "locallaunch"]
    s = subprocess.run(
        send_cmd, input=w.stdout, capture_output=True, text=True, timeout=60
    )
    return s.returncode, (s.stdout + s.stderr).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True)
    ap.add_argument("--subject", required=True)
    ap.add_argument("--body", required=True)
    ap.add_argument(
        "--strict", action="store_true", help="also block UNKNOWN"
    )
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    if _has_header_newline(a.email) or _has_header_newline(a.subject):
        print("⛔ BLOCKED — CR/LF in --email/--subject (header injection). Not sent.")
        sys.exit(1)

    st, why = verify(a.email)
    print(f"verify: {st}  {a.email}  ({why})")

    if st == "INVALID":
        print(f"⛔ BLOCKED — {a.email} INVALID ({why}). Not sent. (pre-send MX gate)")
        sys.exit(1)
    if st == "UNKNOWN" and a.strict:
        print(f"⛔ BLOCKED — {a.email} UNKNOWN ({why}) + --strict. Not sent.")
        sys.exit(1)
    if st == "UNKNOWN":
        print(f"⚠️  {a.email} UNKNOWN ({why}) — sending with caution.")

    if a.dry_run:
        print(f"[dry-run] would send → {a.email} / {a.subject}")
        sys.exit(0)

    rc, out = send(a.email, a.subject, a.body)
    ok = "done" in out.lower() or "sent" in out.lower() or rc == 0
    if rc == 0 and ok:
        print(f"✅ SENT {a.email}")
        sys.exit(0)
    print(f"❌ SEND FAILED {a.email} (rc={rc})")
    print(out[-400:])
    sys.exit(2)


if __name__ == "__main__":
    main()
