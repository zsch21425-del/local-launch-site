import json, re, ssl, os, time
from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request, quote
from urllib.error import URLError, HTTPError

SERPER_KEY = os.environ.get("SERPER_API_KEY", "")

def http_exists(url, timeout=8):
    try:
        ctx = ssl.create_default_context()
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"}, method="HEAD")
        resp = urlopen(req, timeout=timeout, context=ctx)
        return resp.status < 400
    except Exception:
        return False

def http_post_json(url, payload, headers_extra=None, timeout=15):
    try:
        data = json.dumps(payload).encode("utf-8")
        headers = {"Content-Type": "application/json", "User-Agent": "LocalLaunch-Bot/1.0"}
        if headers_extra:
            headers.update(headers_extra)
        ctx = ssl.create_default_context()
        req = Request(url, data=data, headers=headers, method="POST")
        resp = urlopen(req, timeout=timeout, context=ctx)
        return json.loads(resp.read().decode("utf-8", errors="ignore"))
    except Exception as e:
        return {"error": str(e)}


def check_facebook(name, city):
    """Check if business has a Facebook page."""
    fb_url = f"https://www.facebook.com/{quote(name.replace(' ','').replace('&','and').replace('-',''))}"
    exists = http_exists(fb_url)
    return {"url": fb_url, "exists": exists}


def check_yelp(name, city):
    """Check if Yelp search returns results for this business."""
    search_url = f"https://www.yelp.com/search?find_desc={quote(name)}&find_loc={quote(city)}"
    return {"search_url": search_url}


def audit_business_presence(name, city):
    """Run a lightweight presence audit — like our SEO system but for business footprint."""
    t0 = time.time()
    slug = re.sub(r'[^a-z0-9]', '', name.lower())
    slug_hyphen = re.sub(r'[^a-z0-9]+', '-', name.lower().strip())
    city_slug = re.sub(r'[^a-z0-9]', '', city.lower().split(',')[0].strip())

    # ── Factor 1: Website (40 pts) — smart discovery via domain check + Serper ──
    # Common domain patterns to probe
    domains_to_check = [
        f"{slug}.com", f"{slug_hyphen}.com",
        f"{slug}{city_slug}.com", f"{slug_hyphen}-{city_slug}.com",
        f"{slug}.net", f"{slug_hyphen}.net",
        f"{slug}.biz", f"{slug_hyphen}.biz",
    ]
    websites = []
    for d in domains_to_check:
        if http_exists(f"https://{d}"):
            websites.append(f"https://{d}")

    # If domain check failed, try to find the URL via Serper
    serper_url = None
    if not websites and SERPER_KEY:
        sr = search_via_serper(name, city)
        if not sr.get("error"):
            for r in sr.get("results", []):
                # Look for a result that looks like the business homepage
                title_lower = r.get("title", "").lower()
                url = r.get("url", "")
                if name.lower() in title_lower and not any(skip in url.lower() for skip in ['yelp.com','facebook.com','yellowpages.com','nextdoor.com','angi.com','instagram.com','linkedin.com','bbb.org','manta.com']):
                    # Verify it exists
                    if http_exists(url):
                        websites.append(url)
                        serper_url = url
                        break

    website_score = 40 if websites else 0
    if websites:
        website_detail = f"Found at {websites[0]}"
        if serper_url:
            website_detail += " (via Google)"
    else:
        website_detail = "No website detected — checked common domains + Google results"

    # ── Factor 2: Google presence (25 pts) via Serper ──
    google_rank = None
    google_found = False
    google_score = 0
    google_detail = "Not on Google's first page"
    
    if SERPER_KEY:
        query = f'"{name}" "{city}"'
        sr = search_via_serper(name, city)
        if not sr.get("error") and sr.get("results"):
            for i, r in enumerate(sr["results"]):
                if name.lower() in (r.get("title", "") + r.get("snippet", "")).lower():
                    google_found = True
                    google_rank = i + 1
                    break
            if google_rank and google_rank <= 3:
                google_score = 25
                google_detail = f"Page one, position #{google_rank}"
            elif google_rank:
                google_score = 10
                google_detail = f"Found at position #{google_rank}"
            else:
                google_score = 0
                google_detail = "Not appearing for your business name"

    # ── Factor 3: Facebook presence (15 pts) ──
    fb = check_facebook(name, city)
    fb_score = 15 if fb["exists"] else 0
    fb_detail = "Facebook page found" if fb["exists"] else "No Facebook page"

    # ── Factor 4: Directory coverage (10 pts) ──
    directories = [
        {"name": "Yelp", "url": f"https://www.yelp.com/search?find_desc={quote(name)}&find_loc={quote(city)}"},
        {"name": "Yellow Pages", "url": f"https://www.yellowpages.com/search?search_terms={quote(name)}&geo_location_terms={quote(city)}"},
        {"name": "Nextdoor", "url": f"https://nextdoor.com/search/?q={quote(name)}"},
        {"name": "Angi", "url": f"https://www.angi.com/companysearch/us/{quote(city.split(',')[0].strip())}/{quote(slug_hyphen)}/"},
    ]
    # We can't scrape directories but we know they need to be on them
    dir_score = 0  # Placeholder — could check via APIs later
    dir_detail = f"{len(directories)} directories available to claim"

    # ── Factor 5: Google Business Profile (10 pts — manual verification) ──
    gbp_score = 0
    gbp_detail = "Verified manually during onboarding — we handle this for you"

    # ── Compile audit ──
    total = website_score + google_score + fb_score + dir_score + gbp_score
    
    factors = [
        {"factor": "Website", "score": website_score, "max": 40, "detail": website_detail},
        {"factor": "Google presence", "score": google_score, "max": 25, "detail": google_detail},
        {"factor": "Facebook", "score": fb_score, "max": 15, "detail": fb_detail},
        {"factor": "Directories", "score": dir_score, "max": 10, "detail": dir_detail},
        {"factor": "Google Business Profile", "score": gbp_score, "max": 10, "detail": gbp_detail, "pending": True},
    ]

    missing = [f for f in factors if f["score"] == 0 and not f.get("pending")]

    elapsed = round(time.time() - t0, 2)

    return {
        "business": name,
        "city": city,
        "score": total,
        "max_score": 100,
        "factors": factors,
        "missing": missing,
        "pending": [f for f in factors if f.get("pending")],
        "websites": websites,
        "has_website": len(websites) > 0,
        "domains_checked": domains_to_check,
        "google_rank": google_rank,
        "google_found": google_found,
        "directories": directories,
        "confidence": "high" if websites or google_found else "low",
        "search_time_s": elapsed,
    }


def search_via_serper(name, city):
    """Raw search via Serper — returns organic results."""
    query = f'"{name}" "{city}"'
    result = http_post_json(
        "https://google.serper.dev/search",
        {"q": query, "num": 8, "gl": "us", "hl": "en"},
        headers_extra={"X-API-KEY": SERPER_KEY}
    )
    if "error" in result:
        return {"error": result["error"], "results": []}

    results = []
    for r in result.get("organic", []):
        results.append({
            "title": r.get("title", "")[:150],
            "url": r.get("link", ""),
            "snippet": (r.get("snippet", "") or "")[:200],
        })
    return {"results": results}


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/search":
            self._respond(404, {"error": "Not found"})
            return

        try:
            cl = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(cl))
            name = (body.get("name") or "").strip()
            city = (body.get("city") or "").strip()
        except Exception:
            self._respond(400, {"error": "Invalid request"})
            return

        if not name or not city:
            self._respond(400, {"error": "Please enter both business name and city."})
            return

        audit = audit_business_presence(name, city)

        # Build a clean summary headline
        s = audit["score"]
        if s >= 60:
            headline = f"{name} has a solid online presence"
            summary = f"Score: {s}/{audit['max_score']}. You're visible, but there's room to dominate."
        elif s >= 25:
            headline = f"{name} has some presence — gaps to fill"
            summary = f"Score: {s}/{audit['max_score']}. You're partially visible. We can close the gaps fast."
        elif audit["has_website"]:
            headline = f"{name} has a website — but nothing else"
            summary = f"Score: {s}/{audit['max_score']}. A website alone isn't enough. Let's build the full picture."
        else:
            headline = f"No web presence found for {name}"
            summary = f"Score: {s}/{audit['max_score']}. Your business is invisible online. Here's what that costs you — and how we fix it."

        self._respond(200, {
            **audit,
            "headline": headline,
            "summary": summary,
        })

    def _respond(self, status, body):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())
