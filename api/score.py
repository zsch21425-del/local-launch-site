import json, re, time, os, ssl
from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

# ── scan engine (same 13-factor rubric as monthly_report.py) ──

def http_get(url, timeout=15):
    """stdlib HTTP GET — no dependencies."""
    try:
        ctx = ssl.create_default_context()
        req = Request(url, headers={"User-Agent": "LocalLaunch-ScoreBot/1.0"})
        resp = urlopen(req, timeout=timeout, context=ctx)
        return resp.read().decode("utf-8", errors="ignore"), resp.geturl(), resp.status
    except Exception:
        return None, url, 0

def http_head(url, timeout=10):
    try:
        ctx = ssl.create_default_context()
        req = Request(url, headers={"User-Agent": "LocalLaunch-ScoreBot/1.0"}, method="HEAD")
        resp = urlopen(req, timeout=timeout, context=ctx)
        return resp.status < 400
    except Exception:
        return False

def fetch_and_scan(url):
    """Fetch a URL and return scan results dict."""
    t0 = time.time()
    html, final_url, status = http_get(url)
    resp_s = round(time.time() - t0, 2)
    
    if html is None or status == 0:
        return {"error": "Could not reach site. Check the URL and try again."}
    
    https_ok = final_url.startswith("https") and status < 400

    # ── extract signals ──
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
    img_alt_pct = round(100 * len(imgs_with_alt) / len(imgs)) if imgs else 100

    subheadings = len(re.findall(r"<h[23][^>]*>", html, re.I))
    faq_markup = any(t.lower() in ("faqpage", "question") for t in jsonld_types)

    # Probe sitemap + robots
    root = re.match(r"(https?://[^/]+)", url)
    if root:
        sitemap = http_head(root.group(1) + "/sitemap.xml")
        robots = http_head(root.group(1) + "/robots.txt")

    return {
        "title": title, "title_len": len(title) if title else 0,
        "meta_desc": bool(meta_desc), "meta_desc_text": (meta_desc or "")[:200],
        "h1": bool(h1), "h1_text": (h1 or "")[:150],
        "schema_types": sorted(set(jsonld_types)), "schema_count": len(jsonld_types),
        "https": bool(https_ok), "viewport": bool(re.search(r'name=["\']viewport', html, re.I)),
        "word_count": words,
        "img_alt_pct": img_alt_pct,
        "subheadings": subheadings,
        "faq_markup": faq_markup,
        "response_s": resp_s,
        "sitemap": sitemap, "robots": robots,
    }


def score(s):
    """13-factor industry standard — identical to monthly_report.py."""
    det = {}

    # On-page (35 pts)
    if not s.get("title"):
        det["Title tag"] = 0
    elif 10 <= s.get("title_len", 0) <= 70:
        det["Title tag"] = 10
    elif s.get("title_len", 0) > 70:
        det["Title tag"] = 5
    else:
        det["Title tag"] = 3

    det["Meta description"] = 10 if s.get("meta_desc") else 0
    det["H1 tag"] = 5 if s.get("h1") else 0
    det["Content quality"] = 10 if s.get("word_count", 0) >= 800 else round(10 * min(s.get("word_count", 0), 800) / 800)

    # Technical (40 pts)
    det["HTTPS/SSL"] = 10 if s.get("https") else 0
    det["Schema markup"] = 10 if s.get("schema_count", 0) >= 2 else (5 if s.get("schema_count", 0) == 1 else 0)
    det["Mobile viewport"] = 5 if s.get("viewport") else 0
    det["Sitemap"] = 5 if s.get("sitemap") else 0
    det["Robots.txt"] = 5 if s.get("robots") else 0

    rs = s.get("response_s")
    if rs is not None and rs < 2:
        det["Page speed"] = 5
    elif rs is not None and rs < 4:
        det["Page speed"] = 3
    elif rs is not None:
        det["Page speed"] = 1
    else:
        det["Page speed"] = 0

    # Content & accessibility (25 pts)
    det["Image alt text"] = round(10 * s.get("img_alt_pct", 0) / 100)
    det["Subheading structure"] = min(10, round(10 * s.get("subheadings", 0) / 8))
    det["FAQ markup"] = 5 if s.get("faq_markup") else 0

    total = sum(det.values())
    return total, det


def recommendations(det):
    """Generate actionable advice from score breakdown."""
    recs = []
    mapping = {
        "Title tag": ("Your title tag is missing or too short. Include your main keyword and city — keep it under 70 characters.", 10),
        "Meta description": ("No meta description found. Write a 155-character summary with your city and a call to action. This is what shows under your link in Google.", 10),
        "H1 tag": ("No H1 heading on the page. Add one clear main heading with your primary service and city.", 5),
        "Content quality": ("Your page is light on content. Google wants 800+ words of helpful, relevant text. Expand with service details, FAQs, and local info.", 10),
        "HTTPS/SSL": ("Your site isn't using HTTPS. Google flags non-secure sites. Most hosts offer free SSL — turn it on.", 10),
        "Schema markup": ("No structured data found. Adding LocalBusiness + FAQ schema helps Google understand who you are and can earn rich results.", 10),
        "Mobile viewport": ("No mobile viewport tag. Your site may not display properly on phones, which is how most customers search.", 5),
        "Sitemap": ("No sitemap.xml found. Create one to help Google discover all your pages.", 5),
        "Robots.txt": ("No robots.txt found. Add one to guide search engines and point to your sitemap.", 5),
        "Page speed": ("Your page loads slowly. Compress images, use a faster host, and remove unnecessary scripts.", 5),
        "Image alt text": ("Images missing alt text. Add descriptive alt tags so Google can understand your photos and rank them in image search.", 10),
        "Subheading structure": ("Few or no subheadings detected. Break up your content with H2/H3 headings — it helps readers AND search engines.", 10),
        "FAQ markup": ("No FAQ section with structured data. An FAQ with schema markup can win rich results and more clicks.", 5),
    }
    for factor, score in det.items():
        max_score = mapping.get(factor, (None, 0))[1]
        if score < max_score and factor in mapping:
            recs.append({"factor": factor, "score": score, "max": max_score, "advice": mapping[factor][0]})
    return recs


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/score":
            self._respond(404, {"error": "Not found"})
            return

        try:
            cl = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(cl))
            url = (body.get("url") or "").strip()
        except Exception:
            self._respond(400, {"error": "Invalid request"})
            return

        if not url:
            self._respond(400, {"error": "Please enter a website URL."})
            return

        if not url.startswith("http"):
            url = "https://" + url

        result = fetch_and_scan(url)
        if "error" in result:
            self._respond(422, result)
            return

        total, detail = score(result)
        recs = recommendations(detail)

        self._respond(200, {
            "url": url,
            "score": total,
            "breakdown": detail,
            "recommendations": recs,
            "scan": {
                "word_count": result.get("word_count", 0),
                "response_s": result.get("response_s"),
                "title": result.get("title", ""),
                "schema_types": result.get("schema_types", []),
            }
        })

    def _respond(self, status, body):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())
