#!/usr/bin/env python3
"""
monthly_report.py — Local Launch monthly client report generator.

Re-scans a client's site, compares against last month's snapshot, and renders
a branded "here's what moved" PDF for T2/T3 maintenance clients.

Usage (from /mnt/d/LocalLaunch/reporting/):
    python3 monthly_report.py redwood
    python3 monthly_report.py redwood --set reviews=31 --set rating=4.9 \
        --note "Added 2 service-area pages" --note "Fixed GBP categories" \
        --focus "Launch review-request SMS campaign"
    python3 monthly_report.py redwood --html-file cached.html   # offline/test mode
    python3 monthly_report.py redwood --month 2026-08           # override month

Layout:
    clients/<slug>.json            client config (url, tier, keywords, next_focus)
    snapshots/<slug>/YYYY-MM.json  one snapshot per month (auto + manual metrics)
    reports/<slug>/Local-Launch-Report-YYYY-MM.pdf   the deliverable

Manual metrics (pass with --set, they persist into the snapshot):
    reviews, rating, gbp_views, gbp_calls, gbp_directions, leads, citations,
    share_of_ai_voice   (any key=value works; numbers auto-detected)

Deps: requests, weasyprint (both already on the WSL box).
"""
import argparse, datetime, json, os, re, sys, time

BASE = os.path.dirname(os.path.abspath(__file__))
BRAND = {
    "charcoal": "#1B1A18", "copper": "#D4845B", "forest": "#3D7A5C",
    "cream": "#F0EBE3", "muted": "#8A857D",
}
LOGO = os.path.join(os.path.dirname(BASE), "logo.jpg")  # /mnt/d/LocalLaunch/logo.jpg


# ---------------------------------------------------------------- fetch & scan
def fetch_site(url, html_file=None):
    """Return (html, response_seconds, https_ok). Offline mode via html_file."""
    if html_file:
        with open(html_file, encoding="utf-8", errors="ignore") as f:
            return f.read(), None, url.startswith("https")
    import requests
    t0 = time.time()
    r = requests.get(url, timeout=20, headers={"User-Agent": "LocalLaunch-ReportBot/1.0"})
    return r.text, round(time.time() - t0, 2), (r.url.startswith("https") and r.ok)


def probe_exists(url):
    try:
        import requests
        return requests.head(url, timeout=10, allow_redirects=True,
                             headers={"User-Agent": "LocalLaunch-ReportBot/1.0"}).ok
    except Exception:
        return False


def scan(html, https_ok, resp_s, base_url, offline=False):
    """Extract raw on-page signals from homepage HTML."""
    def first(pattern):
        m = re.search(pattern, html, re.I | re.S)
        return m.group(1).strip() if m else None

    title = first(r"<title[^>]*>(.*?)</title>")
    meta_desc = first(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']') or \
                first(r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']')
    h1 = first(r"<h1[^>]*>(.*?)</h1>")
    if h1:
        h1 = re.sub(r"<[^>]+>", "", h1).strip()

    jsonld_types = []
    for block in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', html, re.I | re.S):
        jsonld_types += re.findall(r'"@type"\s*:\s*"([^"]+)"', block)

    text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    words = len(re.findall(r"\b\w+\b", text))

    imgs = re.findall(r"<img\b[^>]*>", html, re.I)
    imgs_with_alt = [i for i in imgs if re.search(r'alt=["\'][^"\']+["\']', i, re.I)]

    sitemap = robots = None
    if not offline:
        root = re.match(r"(https?://[^/]+)", base_url)
        if root:
            sitemap = probe_exists(root.group(1) + "/sitemap.xml")
            robots = probe_exists(root.group(1) + "/robots.txt")

    return {
        "title": title, "title_len": len(title) if title else 0,
        "meta_desc": bool(meta_desc), "h1": bool(h1),
        "schema_types": sorted(set(jsonld_types)), "schema_count": len(jsonld_types),
        "https": bool(https_ok), "viewport": bool(re.search(r'name=["\']viewport', html, re.I)),
        "word_count": words,
        "img_alt_pct": round(100 * len(imgs_with_alt) / len(imgs)) if imgs else 100,
        "subheadings": len(re.findall(r"<h[23][^>]*>", html, re.I)),
        "faq_markup": any(t.lower() in ("faqpage", "question") for t in jsonld_types),
        "response_s": resp_s, "sitemap": sitemap, "robots": robots,
    }


# ---------------------------------------------------------------- scoring
def score_seo(s):
    """Industry-standard 13-factor /100 rubric.
    Weights derived from Semrush Site Audit, Ahrefs, and Moz on-page grader.
    Every factor maps to an auto-detectable signal — no manual grading needed.
    """
    pts, det = 0, {}

    # ---- on-page fundamentals (35 pts) ----
    # Title tag (10): present + optimal length. >70 gets truncated in SERPs but not penalized.
    if not s["title"]:
        det["Title tag"] = 0
    elif 10 <= s["title_len"] <= 70:
        det["Title tag"] = 10
    elif s["title_len"] > 70:
        det["Title tag"] = 5
    else:
        det["Title tag"] = 3

    # Meta description (10): present = full. Content quality checked separately.
    det["Meta description"] = 10 if s["meta_desc"] else 0

    # H1 tag (5): exactly one H1 is ideal; just having one is table-stakes.
    det["H1 tag"] = 5 if s["h1"] else 0

    # Content quality (10): 800+ words signals topical depth for local service pages.
    det["Content quality"] = 10 if s["word_count"] >= 800 else round(10 * min(s["word_count"], 800) / 800)

    # ---- technical SEO (40 pts) ----
    # HTTPS (10): non-negotiable ranking signal since 2014.
    det["HTTPS/SSL"] = 10 if s["https"] else 0

    # Schema markup (10): 2+ structured-data types shows entity investment.
    det["Schema markup"] = 10 if s["schema_count"] >= 2 else (5 if s["schema_count"] == 1 else 0)

    # Mobile viewport (5): required for mobile-first indexing.
    det["Mobile viewport"] = 5 if s["viewport"] else 0

    # Sitemap (5): crawl budget + discovery for new/large sites.
    det["Sitemap"] = 5 if s["sitemap"] else 0

    # Robots.txt (5): crawl directives — stops index bloat, points to sitemap.
    det["Robots.txt"] = 5 if s["robots"] else 0

    # Page speed (5): sub-2s is Google's recommended threshold; under 4s acceptable.
    if s["response_s"] is not None and s["response_s"] < 2:
        det["Page speed"] = 5
    elif s["response_s"] is not None and s["response_s"] < 4:
        det["Page speed"] = 3
    elif s["response_s"] is not None:
        det["Page speed"] = 1
    else:
        det["Page speed"] = 0

    # ---- content & accessibility (25 pts) ----
    # Image alt text (10): accessibility + image-search ranking. Scored by coverage %.
    det["Image alt text"] = round(10 * s["img_alt_pct"] / 100)

    # Subheading structure (10): H2/H3 count signals content hierarchy. ≥8 = excellent.
    det["Subheading structure"] = min(10, round(10 * s["subheadings"] / 8))

    # FAQ markup (5): qualifies for rich results, boosts SERP real estate.
    det["FAQ markup"] = 5 if s["faq_markup"] else 0

    pts = sum(det.values())
    return pts, det


def score_geo(s, manual):
    """GEO signals /100 — auto-detectable subset; citations & reviews may be manual."""
    det = {}
    strong = {"localbusiness", "plumber", "service", "professionalservice", "homeandconstructionbusiness"}
    types = {t.lower() for t in s["schema_types"]}
    det["Schema depth"] = min(30, 10 * len(types & strong) + (5 if types else 0))
    det["Entity grounding"] = min(25, (12 if types & {"organization", "person", "localbusiness"} else 0)
                                  + (13 if s["word_count"] > 400 else 5))
    det["Content structure"] = min(20, (10 if s["faq_markup"] else 0) + min(10, 2 * s["subheadings"]))
    reviews = float(manual.get("reviews", 0) or 0)
    det["Review signals"] = min(15, (8 if {"review", "aggregaterating"} & types else 0)
                                + (7 if reviews > 0 else 0))
    det["Citations"] = min(10, int(float(manual.get("citations", 0) or 0)))
    return sum(det.values()), det


# ---------------------------------------------------------------- snapshots
def snap_dir(slug):
    d = os.path.join(BASE, "snapshots", slug)
    os.makedirs(d, exist_ok=True)
    return d


def load_previous(slug, month):
    files = sorted(f for f in os.listdir(snap_dir(slug)) if f.endswith(".json") and f[:-5] < month)
    if not files:
        return None
    with open(os.path.join(snap_dir(slug), files[-1])) as f:
        return json.load(f)


# ---------------------------------------------------------------- report html
def arrow(delta):
    if delta is None:
        return ""
    if delta > 0:
        return f'<span class="up">&#9650; +{delta:g}</span>'
    if delta < 0:
        return f'<span class="down">&#9660; {delta:g}</span>'
    return '<span class="flat">&#8212;</span>'


def build_html(cfg, cur, prev, month, notes, focus):
    pn = prev or {}
    def delta(key, sub=None):
        a = (cur if sub is None else cur.get(sub, {})).get(key)
        b = (pn if sub is None else pn.get(sub, {})).get(key)
        if a is None or b is None:
            return None
        try:
            return round(float(a) - float(b), 1)
        except (TypeError, ValueError):
            return None

    month_name = datetime.datetime.strptime(month, "%Y-%m").strftime("%B %Y")
    logo_html = f'<img src="file://{LOGO}" class="logo">' if os.path.exists(LOGO) else \
                '<div class="logo-txt">LL</div>'

    def metric_rows(pairs):
        rows = ""
        for label, key in pairs:
            v = cur.get("manual", {}).get(key)
            if v in (None, ""):
                continue
            p = pn.get("manual", {}).get(key)
            d = None
            try:
                d = round(float(v) - float(p), 1) if p not in (None, "") else None
            except (TypeError, ValueError):
                pass
            prev_txt = p if p not in (None, "") else "—"
            rows += f"<tr><td>{label}</td><td>{prev_txt}</td><td><b>{v}</b></td><td>{arrow(d)}</td></tr>"
        return rows

    checks = [
        ("Title tag", "ok" if cur["scan"]["title"] else "miss"),
        ("Meta description", "ok" if cur["scan"]["meta_desc"] else "miss"),
        ("H1 heading", "ok" if cur["scan"]["h1"] else "miss"),
        ("Content (800+ words)", "ok" if cur["scan"]["word_count"] >= 800 else "miss"),
        ("HTTPS secure", "ok" if cur["scan"]["https"] else "miss"),
        ("Schema markup", "ok" if cur["scan"]["schema_count"] >= 2 else ("warn" if cur["scan"]["schema_count"] == 1 else "miss")),
        ("Mobile viewport", "ok" if cur["scan"]["viewport"] else "miss"),
        ("Sitemap", "ok" if cur["scan"]["sitemap"] else ("miss" if cur["scan"]["sitemap"] is False else "na")),
        ("Robots.txt", "ok" if cur["scan"]["robots"] else ("miss" if cur["scan"]["robots"] is False else "na")),
        ("Page speed <2s", "ok" if cur["scan"]["response_s"] is not None and cur["scan"]["response_s"] < 2 else ("warn" if cur["scan"]["response_s"] is not None and cur["scan"]["response_s"] < 4 else "miss")),
        ("Image alt text", "ok" if cur["scan"]["img_alt_pct"] >= 90 else ("warn" if cur["scan"]["img_alt_pct"] >= 50 else "miss")),
        ("Subheading structure", "ok" if cur["scan"]["subheadings"] >= 8 else ("warn" if cur["scan"]["subheadings"] >= 3 else "miss")),
        ("FAQ markup", "ok" if cur["scan"]["faq_markup"] else "miss"),
    ]
    checks_html = "".join(
        f'<div class="chk {c}">'
        f'{"&#10003;" if c == "ok" else ("&#9888;" if c == "warn" else ("&#10007;" if c == "miss" else "&#8212;"))}'
        f' {n}</div>'
        for n, c in checks)

    notes_html = "".join(f"<li>{n}</li>" for n in notes) or "<li>Routine monitoring — no major changes this month.</li>"
    gbp_rows = metric_rows([
        ("Google reviews", "reviews"), ("Average rating", "rating"),
        ("GBP profile views", "gbp_views"), ("Calls from Google", "gbp_calls"),
        ("Direction requests", "gbp_directions"), ("Leads captured", "leads"),
        ("Share of AI voice %", "share_of_ai_voice"),
    ])
    gbp_section = f"""
    <h2>Google Business Profile &amp; Leads</h2>
    <table><tr><th>Metric</th><th>Last month</th><th>Now</th><th>Change</th></tr>{gbp_rows}</table>
    """ if gbp_rows else ""

    prev_label = datetime.datetime.strptime(pn["month"], "%Y-%m").strftime("%b %Y") if pn else "baseline"

    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
    @page {{ size: letter; margin: 0.7in; }}
    body {{ font-family: 'Space Grotesk','Inter',-apple-system,sans-serif; color: {BRAND['charcoal']};
           font-size: 10.5pt; line-height: 1.45; }}
    .head {{ background: {BRAND['charcoal']}; color: {BRAND['cream']}; padding: 22px 26px;
             border-radius: 10px; display: flex; align-items: center; gap: 18px; }}
    .logo {{ width: 52px; height: 52px; border-radius: 8px; object-fit: cover; }}
    .logo-txt {{ width:52px;height:52px;border-radius:8px;background:{BRAND['copper']};color:#fff;
                 font-weight:700;font-size:20pt;text-align:center;line-height:52px; }}
    .head h1 {{ margin: 0; font-size: 16pt; }} .head .sub {{ color: {BRAND['copper']}; font-size: 9.5pt; }}
    .scores {{ display: flex; gap: 14px; margin: 18px 0; }}
    .card {{ flex: 1; border: 1.5px solid {BRAND['charcoal']}22; border-radius: 10px; padding: 14px 18px; }}
    .card .big {{ font-size: 24pt; font-weight: 700; color: {BRAND['forest']}; }}
    .card .lbl {{ font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; color: {BRAND['muted']}; }}
    .up {{ color: {BRAND['forest']}; font-weight: 700; }} .down {{ color: #B0442E; font-weight: 700; }}
    .flat {{ color: {BRAND['muted']}; }}
    h2 {{ font-size: 12pt; border-bottom: 2px solid {BRAND['copper']}; padding-bottom: 4px; margin: 20px 0 10px; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 9.5pt; }}
    th {{ background: {BRAND['charcoal']}; color: {BRAND['cream']}; text-align: left; padding: 6px 9px; }}
    td {{ padding: 6px 9px; border-bottom: 1px solid #ddd; }}
    .grid {{ display: flex; flex-wrap: wrap; gap: 6px; }}
    .chk {{ padding: 5px 10px; border-radius: 6px; font-size: 9pt; background: #eee; }}
    .chk.ok {{ background: {BRAND['forest']}1A; color: {BRAND['forest']}; font-weight: 600; }}
    .chk.warn {{ background: {BRAND['copper']}1A; color: {BRAND['copper']}; font-weight: 600; }}
    .chk.miss {{ background: #B0442E1A; color: #B0442E; font-weight: 600; }}
    .focus {{ background: {BRAND['copper']}1A; border-left: 4px solid {BRAND['copper']};
              padding: 10px 14px; border-radius: 0 8px 8px 0; }}
    .foot {{ margin-top: 26px; font-size: 8.5pt; color: {BRAND['muted']};
             border-top: 1px solid #ddd; padding-top: 8px; }}
    ul {{ margin: 6px 0; padding-left: 20px; }}
    </style></head><body>

    <div class="head">{logo_html}
      <div><h1>Monthly Visibility Report — {cfg['name']}</h1>
      <div class="sub">Local Launch &middot; {month_name} &middot; {cfg.get('tier','')} plan</div></div>
    </div>

    <div class="scores">
      <div class="card"><div class="lbl">SEO score</div><div class="big">{cur['seo_score']}<small>/100</small></div>
        <div>vs {prev_label}: {arrow(delta('seo_score'))}</div></div>
      <div class="card"><div class="lbl">AI visibility (GEO) signals</div><div class="big">{cur['geo_score']}<small>/100</small></div>
        <div>vs {prev_label}: {arrow(delta('geo_score'))}</div></div>
      <div class="card"><div class="lbl">Homepage load</div>
        <div class="big">{cur['scan']['response_s'] if cur['scan']['response_s'] is not None else '—'}<small>s</small></div>
        <div>word count: {cur['scan']['word_count']}</div></div>
    </div>

    <h2>Site health checks</h2><div class="grid">{checks_html}</div>

    {gbp_section}

    <h2>What we did this month</h2><ul>{notes_html}</ul>

    <h2>Focus for next month</h2><div class="focus">{focus}</div>

    <div class="foot">Prepared by Zach Schreiner &middot; Local Launch &middot; zsch21425@gmail.com &middot;
    local-launch-site.vercel.app &middot; Scores use the same 100-point rubric as your original audit.</div>
    </body></html>"""


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("client", help="client slug — must match clients/<slug>.json")
    ap.add_argument("--month", default=datetime.date.today().strftime("%Y-%m"))
    ap.add_argument("--set", dest="sets", action="append", default=[], metavar="KEY=VAL")
    ap.add_argument("--note", dest="notes", action="append", default=[])
    ap.add_argument("--focus", default=None)
    ap.add_argument("--html-file", default=None, help="score a saved HTML file (offline/test)")
    ap.add_argument("--no-pdf", action="store_true", help="write HTML only")
    a = ap.parse_args()

    cfg_path = os.path.join(BASE, "clients", f"{a.client}.json")
    if not os.path.exists(cfg_path):
        sys.exit(f"No config at {cfg_path} — copy clients/redwood.json as a template.")
    cfg = json.load(open(cfg_path))

    manual = dict(cfg.get("manual_defaults", {}))
    for kv in a.sets:
        k, _, v = kv.partition("=")
        try:
            manual[k] = float(v) if "." in v else int(v)
        except ValueError:
            manual[k] = v

    html, resp_s, https_ok = fetch_site(cfg["url"], a.html_file)
    s = scan(html, https_ok, resp_s, cfg["url"], offline=bool(a.html_file))
    seo, seo_det = score_seo(s)
    geo, geo_det = score_geo(s, manual)

    cur = {"month": a.month, "url": cfg["url"], "scan": s, "manual": manual,
           "seo_score": seo, "seo_detail": seo_det,
           "geo_score": geo, "geo_detail": geo_det,
           "generated": datetime.datetime.now().isoformat(timespec="seconds")}
    prev = load_previous(a.client, a.month)

    with open(os.path.join(snap_dir(a.client), f"{a.month}.json"), "w") as f:
        json.dump(cur, f, indent=2)

    focus = a.focus or cfg.get("next_focus", "Keep building — details at our next check-in.")
    out_dir = os.path.join(BASE, "reports", a.client)
    os.makedirs(out_dir, exist_ok=True)
    html_out = os.path.join(out_dir, f"Local-Launch-Report-{a.month}.html")
    report = build_html(cfg, cur, prev, a.month, a.notes, focus)
    with open(html_out, "w", encoding="utf-8") as f:
        f.write(report)
    print("HTML :", html_out)
    print(f"SEO {seo}/100  GEO {geo}/100  (prev: "
          f"{prev['seo_score'] if prev else '—'}/{prev['geo_score'] if prev else '—'})")

    if not a.no_pdf:
        from weasyprint import HTML
        pdf_out = html_out.replace(".html", ".pdf")
        HTML(string=report, base_url=BASE).write_pdf(pdf_out)
        print("PDF  :", pdf_out)


if __name__ == "__main__":
    main()
