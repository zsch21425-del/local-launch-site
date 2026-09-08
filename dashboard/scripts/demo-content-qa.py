#!/usr/bin/env python3
"""Demo content QA — read-only sweep of every deployed client demo for the
slop/glitch classes found in the M&M Plumbing demo:
  1. phone: displayed vs tel: link vs pipeline phone (mismatch = lost calls)
  2. placeholder / fabricated copy
  3. emoji (should be SVG icons, never emoji)
  4. wrong footer email (zsch21425@gmail.com etc.)
Fetch-only — never edits or deploys. Prints a table + writes JSON to data/demo-qa.json.
"""
import json, re, ssl, urllib.request, concurrent.futures, sys

PIPE = "/mnt/d/LocalLaunch/dashboard/data/pipeline.json"
data = json.load(open(PIPE))
companies = data["companies"]

def resolve(c):
    u = (c.get("demo") or {}).get("url") or c.get("demoUrl")
    return u.strip() if (u and isinstance(u, str) and u.strip()) else None

targets = [(c, resolve(c)) for c in companies if resolve(c)]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# emoji-as-icon (excludes U+2605 ★ star ratings, which are legitimate)
EMOJI = re.compile(
    "[\U0001F300-\U0001FAFF\U00002700-\U000027BF\U00002B00-\U00002BFF\U0000FE0F\U0000200D]"
)
PHONE_DISPLAY = re.compile(r"\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}")
TEL = re.compile(r"tel:\+?([\d\-]+)")
PLACEHOLDER = re.compile(
    r"coming soon|your name here|lorem ipsum|TBD|\bTODO\b|"
    r"over a decade|family-run|decades of|since 19\d\d|since 20\d\d|"
    r"years of experience|we have been serving|dummy|sample text|"
    r"join our happy|publish your review",
    re.I,
)
WRONG_FOOTER = re.compile(r"zsch21425|@gmail\.com|fairway|subaru", re.I)

def norm_phone(s):
    return re.sub(r"\D", "", s or "")

def check(item):
    c, url = item
    pipe_phone = norm_phone(c.get("phone") or "")
    name = c.get("name", "")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0"})
    try:
        html = urllib.request.urlopen(req, timeout=20, context=ctx).read().decode("utf-8", "ignore")
    except Exception as e:
        return {"slug": c["id"], "name": name, "url": url, "error": type(e).__name__}

    # 1. phones
    displayed = [norm_phone(m) for m in PHONE_DISPLAY.findall(html) if norm_phone(m)]
    tel_links = [norm_phone(m[0]) for m in TEL.findall(html) if norm_phone(m[0])]
    # strip leading country code 1 for comparison
    def cmp10(x):
        x = re.sub(r"\D", "", x)
        return x[-10:] if len(x) > 10 else x
    d10 = sorted(set(cmp10(x) for x in displayed if len(cmp10(x)) >= 10))
    t10 = sorted(set(cmp10(x) for x in tel_links if len(cmp10(x)) >= 10))
    p10 = cmp10(pipe_phone)

    phone_issues = []
    if d10 and t10 and not (set(d10) & set(t10)):
        phone_issues.append(f"displayed {d10} != tel {t10}")
    if p10 and d10 and p10 not in d10:
        phone_issues.append(f"pipeline {p10} not on page (shown {d10})")

    # 2. placeholder / fabricated
    place = PLACEHOLDER.findall(html)
    # 3. emoji
    emoji = EMOJI.findall(html)
    # 4. wrong footer
    footer = WRONG_FOOTER.findall(html)

    issues = []
    if phone_issues:
        issues.append("PHONE: " + "; ".join(phone_issues))
    if place:
        issues.append("PLACEHOLDER: " + ", ".join(sorted(set(x.lower() for x in place)))[:120])
    if emoji:
        issues.append(f"EMOJI ({len(emoji)})")
    if footer:
        issues.append("FOOTER: " + ", ".join(sorted(set(x.lower() for x in footer)))[:80])

    return {
        "slug": c["id"], "name": name, "url": url,
        "displayed": d10, "tel": t10, "pipe": p10,
        "issues": issues,
    }

results = []
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
    for r in ex.map(check, targets):
        results.append(r)

clean = [r for r in results if not r.get("issues")]
dirty = [r for r in results if r.get("issues")]

print(f"\n=== DEMO CONTENT QA — {len(results)} demos checked, {len(dirty)} with issues ===\n")
for r in dirty:
    if r.get("error"):
        print(f"  ERROR {r['error']:12} {r['name']}  ->  {r['url']}")
        continue
    for iss in r["issues"]:
        print(f"  {iss}")
        print(f"     {r['name']}  ->  {r['url']}")
print(f"\n=== CLEAN ({len(clean)}) ===")
for r in clean:
    print(f"  ok  {r['name']}")

json.dump({"checked": len(results), "dirty": dirty, "clean": clean},
          open("/mnt/d/LocalLaunch/dashboard/data/demo-qa.json", "w"), indent=2)
print(f"\nwrote data/demo-qa.json")
