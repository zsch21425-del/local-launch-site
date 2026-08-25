#!/usr/bin/env python3
"""Local Launch invoice sender — Stripe Invoicing.

Creates a customer + invoice + hosted invoice URL so a client can pay by card
or bank transfer. Run with live keys to send real invoices.

Usage:
  ll-invoice "Acme Plumbing" "bob@acmeplumbing.com" 300 "Website + SEO Package"
  ll-invoice --send "Acme Plumbing" "bob@acmeplumbing.com" 300 "Website + SEO Package"
  ll-invoice --send "Acme Plumbing" "bob@acmeplumbing.com" 300 "T1 Foundation" --add "AI Receptionist - 35" --add "Appointment scheduler - 25"

  --add "Description - $AMOUNT"  adds an itemized line item (repeatable).
  Total = main amount + all add-on amounts.
"""
import json
import os
import re
import sys
import urllib.request
import urllib.parse
import urllib.error

STRIPE_API = "https://api.stripe.com/v1"


def stripe(method, path, data=None):
    key = os.environ.get("STRIPE_SECRET_KEY", "")
    if not key:
        raise SystemExit("❌ STRIPE_SECRET_KEY not set (check /home/zach/.hermes/profiles/revenue-gen/.env)")
    body = urllib.parse.urlencode(data or {}).encode()
    req = urllib.request.Request(f"{STRIPE_API}{path}", data=body if method == "POST" else None,
                                 method=method,
                                 headers={"Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        try:
            detail = json.loads(err).get("error", {}).get("message", err)
        except Exception:
            detail = err
        raise SystemExit(f"❌ Stripe {path}: HTTP {e.code} — {detail}")


def find_or_create_customer(name, email):
    # dedupe by email
    existing = stripe("GET", f"/customers?email={urllib.parse.quote(email)}&limit=1")
    if existing.get("data"):
        c = existing["data"][0]
        return c["id"]
    c = stripe("POST", "/customers", {"name": name, "email": email})
    return c["id"]


def main():
    args = sys.argv[1:]
    send = False
    addons = []  # list of (description, amount_cents)
    positionals = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--send":
            send = True
            i += 1
        elif a == "--add":
            if i + 1 >= len(args):
                raise SystemExit("❌ --add requires \"Description - $AMOUNT\"")
            raw = args[i + 1]
            m = re.search(r"[\$]?\s*([\d.]+)\s*$", raw)
            if not m:
                raise SystemExit(f"❌ --add could not parse amount from: {raw!r}")
            desc = re.sub(r"[\$]?\s*[\d.]+\s*$", "", raw).strip().rstrip(" -–—")
            addons.append((desc, int(round(float(m.group(1)) * 100))))
            i += 2
        else:
            positionals.append(a)
            i += 1
    if len(positionals) < 4:
        print(__doc__)
        return 1
    name, email = positionals[0], positionals[1]
    amount_dollars = float(positionals[2])
    service = " ".join(positionals[3:])
    amount_cents = int(round(amount_dollars * 100))
    total_cents = amount_cents + sum(a[1] for a in addons)

    print(f"• Customer: {name} <{email}>")
    customer_id = find_or_create_customer(name, email)
    print(f"  customer_id: {customer_id}")

    # Modern flow: create invoice item(s) first, then invoice picks them up
    stripe("POST", "/invoiceitems", {
        "customer": customer_id,
        "amount": str(amount_cents),
        "currency": "usd",
        "description": service,
    })
    for desc, cents in addons:
        stripe("POST", "/invoiceitems", {
            "customer": customer_id,
            "amount": str(cents),
            "currency": "usd",
            "description": desc,
        })
    inv = stripe("POST", "/invoices", {
        "customer": customer_id,
        "description": "Local Launch — websites + SEO for local businesses. Terms: https://locallaunchupstate.com/terms.html",
        "auto_advance": "true",
        "collection_method": "send_invoice",
        "days_until_due": "14",
        "pending_invoice_items_behavior": "include",
        "metadata[source]": "local-launch-invoice",
    })
    invoice_id = inv["id"]
    finalized = stripe("POST", f"/invoices/{invoice_id}/finalize")
    print(f"  invoice_id: {invoice_id}")
    print(f"  amount: ${amount_dollars:,.2f} — {service}")
    for desc, cents in addons:
        print(f"  add-on: ${cents/100:,.2f} — {desc}")
    print(f"  TOTAL: ${total_cents/100:,.2f}")
    print(f"  hosted_invoice_url: {finalized.get('hosted_invoice_url')}")

    if send:
        # auto_advance already finalized AND emailed the invoice on creation
        # (collection_method=send_invoice auto-sends on finalize). Explicit /send
        # would 400 with "already sent" — so we just confirm here.
        print("  ✅ Invoice emailed to client automatically (Stripe sends on finalize).")
    else:
        print("  (invoice auto-emails on finalize — or share the URL above)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
