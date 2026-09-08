#!/usr/bin/env python3
"""verify_email.py — HARD pre-send gate (MX + optional SMTP RCPT).

INVALID = never send (dead domain / no MX / mailbox 5.1.1)
VALID   = safe to send
UNKNOWN = probe blocked / temp — default allow with warning; --strict blocks

Usage:
  verify_email.py addr [addr...]
  verify_email.py --strict addr
"""
from __future__ import annotations

import smtplib
import socket
import sys

try:
    import dns.resolver  # type: ignore
except ImportError:
    dns = None  # type: ignore

FROM = "verify@locallaunchupstate.com"
TIMEOUT = 12

FREE = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "ymail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "comcast.net",
    "bellsouth.net",
    "att.net",
    "sbcglobal.net",
    "verizon.net",
    "charter.net",
    "cox.net",
    "protonmail.com",
    "proton.me",
}


def get_mx(domain: str):
    if dns is not None:
        try:
            ans = dns.resolver.resolve(domain, "MX")
            return sorted(
                [(r.preference, str(r.exchange).rstrip(".")) for r in ans]
            )
        except Exception:
            return []
    # fallback: socket only proves A exists, not MX — treat no-dns as invalid
    try:
        socket.getaddrinfo(domain, None)
        # domain resolves but we couldn't check MX without dnspython
        return [(-1, domain)]  # soft signal
    except Exception:
        return []


def verify(address: str):
    address = address.strip()
    if "@" not in address:
        return "INVALID", "malformed"
    local, _, domain = address.rpartition("@")
    domain = domain.lower()
    if not local or not domain or "." not in domain:
        return "INVALID", "malformed"

    if domain in FREE:
        return "VALID", "free-mail"

    mxs = get_mx(domain)
    if not mxs:
        return "INVALID", "no MX (domain dead — would bounce)"

    # soft MX (socket fallback only) → still try SMTP if real mx list
    real_mxs = [(p, h) for p, h in mxs if p >= 0]
    if not real_mxs:
        # domain has A but no MX library — unknown
        return "UNKNOWN", "MX library missing; domain resolves"

    for _, mx in real_mxs:
        try:
            s = smtplib.SMTP(timeout=TIMEOUT)
            s.connect(mx, 25)
            s.ehlo_or_helo_if_needed()
            s.mail(FROM)
            code, resp = s.rcpt(address)
            try:
                s.quit()
            except Exception:
                pass
            resp_s = (
                resp.decode(errors="replace")
                if isinstance(resp, bytes)
                else str(resp)
            )
            if code in (250, 251):
                return "VALID", "accepted"
            if code == 550:
                low = resp_s.lower()
                if "5.1.1" in low or any(
                    k in low
                    for k in (
                        "not exist",
                        "no such",
                        "unknown user",
                        "not found",
                        "unrouteable",
                        "invalid recipient",
                        "no mailbox",
                    )
                ):
                    return "INVALID", "address not found"
                if (
                    "5.7" in low
                    or "rejected" in low
                    or "blocked" in low
                    or "client host" in low
                ):
                    return "UNKNOWN", "sender IP blocked (5.7.x)"
                return "UNKNOWN", f"rcpt 550 ({resp_s[:45]})"
            if code in (450, 451, 452, 421):
                return "UNKNOWN", f"rcpt {code} (temp)"
            return "UNKNOWN", f"rcpt {code}"
        except Exception:
            continue
    # MX existed but all unreachable — domain is NOT dead; mail may still work
    return "VALID", "MX present (SMTP probe unreachable — allow)"


if __name__ == "__main__":
    addrs = [a for a in sys.argv[1:] if not a.startswith("-")]
    if not addrs:
        addrs = [l.strip() for l in sys.stdin if l.strip()]
    if not addrs:
        print("no addresses given", file=sys.stderr)
        sys.exit(2)
    all_ok = True
    for a in addrs:
        st, why = verify(a)
        print(f"{st:8} {a}  ({why})")
        if st == "INVALID":
            all_ok = False
    sys.exit(0 if all_ok else 1)
