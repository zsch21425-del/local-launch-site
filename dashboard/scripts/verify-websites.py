#!/usr/bin/env python3
"""
verify-websites.py — double-check the "no website" vs "has website" split in the
Local Launch prospect pipeline.

Reads  : data/pipeline.json            (NEVER written)
Writes : data/website-verification.json (resumable, rewritten after every company)

Method:
  1. For every company, run a free LL-research web search: `ll-research.py search
     "<name> <city>"` (OpenSERP backend on droplet 137.184.135.50:7000 — FREE).
  2. From the search hits, pick the best *official-looking* domain for the business
     (skip directories / social / review aggregators), score it, and decide
     foundWebsite / websiteUrl / confidence.
  3. Lightweight liveness probe (HTTP GET, 1 request) on (a) the URL already in the
     pipeline and (b) the discovered candidate — this is what catches "has website
     but it's dead/expired/suspended".
  4. Classify each company (see CLASSIFY below) and write partial progress.

Rate limiting: --sleep between calls (default 12s) + a longer cooldown every
--batch calls (default: 90s every 12). Resumable: re-run and it skips companies
already done unless --force / --retry-errors.

Usage:
  python3 scripts/verify-websites.py                 # full run, resumes
  python3 scripts/verify-websites.py --limit 20      # do 20 then stop
  python3 scripts/verify-websites.py --retry-errors  # re-do only failed lookups
  python3 scripts/verify-websites.py --only cc-headlight,omega-auto
  python3 scripts/verify-websites.py --summary       # just recompute+print summary
"""
import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PIPELINE = os.path.join(ROOT, "data", "pipeline.json")
OUT = os.path.join(ROOT, "data", "website-verification.json")

LL_RESEARCH = os.environ.get(
    "LL_RESEARCH",
    "/mnt/d/Hermes/hermes-home/profiles/revenue-gen/scripts/ll-research.py",
)
DROPLET = os.environ.get("LL_DROPLET", "137.184.135.50")

# Domains that are never a business's own site — directories, social, reviews, maps.
DIRECTORY_DOMAINS = {
    "facebook.com", "m.facebook.com", "instagram.com", "linkedin.com", "twitter.com",
    "x.com", "youtube.com", "pinterest.com", "tiktok.com", "nextdoor.com",
    "yelp.com", "bbb.org", "angi.com", "angieslist.com", "thumbtack.com",
    "homeadvisor.com", "porch.com", "houzz.com", "buildzoom.com", "manta.com",
    "yellowpages.com", "superpages.com", "mapquest.com", "foursquare.com",
    "chamberofcommerce.com", "birdeye.com", "google.com", "goo.gl", "maps.google.com",
    "bing.com", "apple.com", "indeed.com", "glassdoor.com", "ziprecruiter.com",
    "zillow.com", "trulia.com", "realtor.com", "expertise.com", "trustpilot.com",
    "alignable.com", "cylex.us.com", "opendi.us", "hotfrog.com", "brownbook.net",
    "elocal.com", "citysearch.com", "local.com", "merchantcircle.com", "n49.com",
    "dnb.com", "bloomberg.com", "zoominfo.com", "rocketreach.co", "apollo.io",
    "getjobber.com", "wellsfargo.com", "facebook.com", "threads.net", "reddit.com",
    "craigslist.org", "offerup.com", "nextdoor.com", "carfax.com", "cars.com",
    "autotrader.com", "cargurus.com", "kbb.com", "signalhire.com", "leadferret.com",
    "usphonebook.com", "spokeo.com", "whitepages.com", "fastpeoplesearch.com",
    "buzzfile.com", "bizapedia.com", "opencorporates.com", "corporationwiki.com",
    "clustrmaps.com", "homefacts.com", "waze.com", "tripadvisor.com",
}
# Hosted-builder subdomains that mean "someone stood up a page" but on a platform.
BUILDER_HOST_SUFFIXES = (
    ".vercel.app", ".netlify.app", ".web.app", ".firebaseapp.com",
    ".square.site", ".business.site", ".godaddysites.com", ".wixsite.com",
    ".weebly.com", ".jobbersites.com", ".jimdosite.com", ".webnode.com",
    ".companyfrom.com", ".site123.me", ".mystrikingly.com", ".myshopify.com",
)

STOPWORDS = {
    "the", "and", "llc", "inc", "co", "corp", "company", "services", "service",
    "of", "a", "&", "l", "l.l.c", "l.l.c.", "group", "solutions", "sc", "nc",
    "greenville", "spartanburg", "anderson", "greer", "mauldin", "simpsonville",
    "charlotte", "columbia", "pro", "professional", "your",
}


def norm_tokens(name: str):
    name = name.lower().replace("&", " and ")
    toks = re.findall(r"[a-z0-9]+", name)
    return [t for t in toks if t not in STOPWORDS and len(t) > 1]


def registrable(host: str) -> str:
    host = host.lower().lstrip(".")
    if host.startswith("www."):
        host = host[4:]
    parts = host.split(".")
    if len(parts) <= 2:
        return host
    # crude 2-level public-suffix handling for the few we expect
    two_level = {"co.uk", "com.au", "us.com", "co.nz"}
    if ".".join(parts[-2:]) in two_level:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:])


def is_directory(host: str) -> bool:
    reg = registrable(host)
    if reg in DIRECTORY_DOMAINS:
        return True
    return host.lower() in DIRECTORY_DOMAINS


def is_builder_host(host: str) -> bool:
    h = host.lower()
    return any(h.endswith(sfx) for sfx in BUILDER_HOST_SUFFIXES)


# --------------------------------------------------------------------------- #
#  Search backend                                                             #
# --------------------------------------------------------------------------- #
def ll_search(query: str, limit: int = 10, engine: str = "google", timeout: int = 90):
    """Run ll-research.py search. Returns (results_list, error_str_or_None)."""
    try:
        p = subprocess.run(
            [sys.executable, LL_RESEARCH, "search", query,
             "--limit", str(limit), "--engine", engine, "--format", "json"],
            capture_output=True, text=True, timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return [], "search timeout"
    except FileNotFoundError:
        return [], f"ll-research not found at {LL_RESEARCH}"
    raw = (p.stdout or "").strip()
    if not raw:
        return [], (p.stderr or "empty response").strip()[:300]
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return [], f"non-JSON response: {raw[:200]}"
    return _flatten_results(data)


def _flatten_results(data):
    """OpenSERP /mega/search shape is not fully pinned down; handle the plausibles."""
    if isinstance(data, dict) and data.get("error"):
        return [], str(data["error"])[:300]
    out = []

    def add(item):
        if not isinstance(item, dict):
            return
        url = item.get("url") or item.get("link") or item.get("href")
        if not url:
            return
        out.append({
            "url": url,
            "title": item.get("title") or item.get("name") or "",
            "description": item.get("description") or item.get("snippet")
            or item.get("content") or "",
        })

    if isinstance(data, list):
        for it in data:
            add(it)
    elif isinstance(data, dict):
        for key in ("results", "data", "items", "organic", "organic_results"):
            v = data.get(key)
            if isinstance(v, list):
                for it in v:
                    add(it)
        # engine-keyed: {"google":[...], "duckduckgo":[...]}
        for v in data.values():
            if isinstance(v, list):
                for it in v:
                    add(it)
            elif isinstance(v, dict):
                for kk in ("results", "organic", "items"):
                    if isinstance(v.get(kk), list):
                        for it in v[kk]:
                            add(it)
    # de-dup by url
    seen, uniq = set(), []
    for r in out:
        if r["url"] in seen:
            continue
        seen.add(r["url"])
        uniq.append(r)
    return uniq, None


# --------------------------------------------------------------------------- #
#  Liveness probe                                                             #
# --------------------------------------------------------------------------- #
def probe(url: str, timeout: int = 12):
    """One GET. Returns dict {alive, status, finalUrl, note}."""
    if not url:
        return {"alive": False, "status": None, "finalUrl": None, "note": "no url"}
    if not re.match(r"^https?://", url):
        url = "https://" + url
    req = urllib.request.Request(url, method="GET", headers={
        "User-Agent": "Mozilla/5.0 (compatible; LL-website-verify/1.0)"
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read(4000).decode("utf-8", "ignore").lower()
            final = resp.geturl()
            status = resp.status
    except urllib.error.HTTPError as e:
        return {"alive": e.code < 500 and e.code not in (403, 404, 410),
                "status": e.code, "finalUrl": url, "note": f"HTTP {e.code}"}
    except Exception as e:
        return {"alive": False, "status": None, "finalUrl": url,
                "note": type(e).__name__ + ": " + str(e)[:120]}
    # parked / suspended / for-sale heuristics
    park = any(s in body for s in [
        "domain is for sale", "buy this domain", "domain for sale", "parked domain",
        "account suspended", "this site has been suspended", "website coming soon",
        "future home of something", "godaddy.com/domains", "hugedomains",
        "default web page", "welcome to nginx", "index of /",
    ])
    return {
        "alive": (status < 400) and not park,
        "status": status,
        "finalUrl": final,
        "note": "parked/suspended page" if park else "ok",
    }


# --------------------------------------------------------------------------- #
#  Candidate selection                                                        #
# --------------------------------------------------------------------------- #
def score_candidates(name, results):
    toks = norm_tokens(name)
    cands = {}
    for rank, r in enumerate(results):
        try:
            host = urllib.parse.urlparse(
                r["url"] if re.match(r"^https?://", r["url"]) else "http://" + r["url"]
            ).netloc
        except Exception:
            continue
        if not host:
            continue
        reg = registrable(host)
        directory = is_directory(host)
        builder = is_builder_host(host)
        dom_str = re.sub(r"[^a-z0-9]", "", reg.split(".")[0])
        overlap = sum(1 for t in toks if t in dom_str)
        sc = 0.0
        sc += overlap * 3.0
        if overlap == len(toks) and toks:
            sc += 3.0
        if rank < 3:
            sc += 2.0
        elif rank < 6:
            sc += 1.0
        if reg.endswith((".com", ".net", ".biz", ".us", ".co", ".design")):
            sc += 1.0
        if directory:
            sc -= 100.0
        if builder:
            sc -= 1.0  # still a site, just note it
        entry = cands.setdefault(reg, {
            "domain": reg, "url": f"https://{reg}", "hits": 0, "bestRank": rank,
            "score": 0.0, "directory": directory, "builder": builder,
            "sampleTitle": r["title"][:120],
        })
        entry["hits"] += 1
        entry["bestRank"] = min(entry["bestRank"], rank)
        entry["score"] = max(entry["score"], sc)
    for e in cands.values():
        e["score"] += min(e["hits"] - 1, 3) * 1.0
    ranked = sorted(cands.values(), key=lambda e: e["score"], reverse=True)
    return ranked


# --------------------------------------------------------------------------- #
#  Baseline (local, no network) — classify what the pipeline currently says    #
# --------------------------------------------------------------------------- #
DEMO_RE = re.compile(r"(vercel\.app|netlify\.app)/?$|(-demo|-website|-site)\b", re.I)
ANNOTATION_RE = re.compile(
    r"\((?:broken|expired|suspended|dead|down|BROKEN[^)]*|SUSPENDED[^)]*|deactivated[^)]*)\)",
    re.I,
)


def parse_pipeline_website(raw: str):
    """Return dict describing the website string already in the pipeline."""
    raw = (raw or "").strip()
    if not raw:
        return {"raw": "", "kind": "none", "url": None, "annotatedDead": False}
    annotated_dead = bool(ANNOTATION_RE.search(raw))
    # strip trailing "(note)"
    core = re.sub(r"\s*\(.*\)\s*$", "", raw).strip()
    if not core or core.lower().startswith(("hidden", "found")):
        return {"raw": raw, "kind": "note-only", "url": None,
                "annotatedDead": annotated_dead}
    url = core if re.match(r"^https?://", core) else "https://" + core
    host = urllib.parse.urlparse(url).netloc
    if is_builder_host(host) and (".vercel.app" in host or ".netlify.app" in host):
        kind = "ll-demo-build"
    elif is_builder_host(host):
        kind = "hosted-builder"
    else:
        kind = "real-domain"
    return {"raw": raw, "kind": kind, "url": url, "annotatedDead": annotated_dead}


# --------------------------------------------------------------------------- #
#  Main per-company routine                                                    #
# --------------------------------------------------------------------------- #
def city_of(location: str) -> str:
    loc = (location or "").split("(")[0].strip()
    loc = loc.split("/")[0].strip()
    loc = re.sub(r"\s+\d{5}(-\d{4})?$", "", loc).strip()  # drop trailing ZIP
    return loc.rstrip(",").strip()


def verify_company(co, do_search=True):
    name = co.get("name", "")
    loc = co.get("location", "")
    city = city_of(loc)
    pw = parse_pipeline_website(co.get("website", ""))

    rec = {
        "id": co.get("id"),
        "name": name,
        "category": co.get("category"),
        "location": loc,
        "pipelineWebsite": pw["raw"],
        "pipelineWebsiteKind": pw["kind"],
        "pipelineHasRealSite": pw["kind"] in ("real-domain", "hosted-builder"),
        "pipelineAnnotatedDead": pw["annotatedDead"],
        "query": f"{name} {city}".strip(),
        "searchOk": None,
        "searchError": None,
        "resultCount": 0,
        "candidates": [],
        "foundWebsite": False,
        "websiteUrl": None,
        "confidence": "low",
        "pipelineUrlProbe": None,
        "candidateProbe": None,
        "classification": None,
        "notes": [],
        "checkedAt": dt.datetime.utcnow().isoformat() + "Z",
    }

    # -- probe the URL already in the pipeline (if it's a real/builder site) --
    if pw["url"] and pw["kind"] != "note-only":
        rec["pipelineUrlProbe"] = probe(pw["url"])

    # -- web search --
    ranked = []
    if do_search:
        results, err = ll_search(rec["query"])
        rec["searchOk"] = err is None
        rec["searchError"] = err
        rec["resultCount"] = len(results)
        if not err:
            ranked = score_candidates(name, results)
            rec["candidates"] = [
                {k: c[k] for k in ("domain", "score", "hits", "bestRank",
                                   "directory", "builder", "sampleTitle")}
                for c in ranked[:6]
            ]

    # -- pick best candidate --
    best = None
    for c in ranked:
        if c["directory"]:
            continue
        if c["score"] >= 4.0:
            best = c
            break

    if best:
        rec["candidateProbe"] = probe(best["url"])
        live = rec["candidateProbe"]["alive"]
        rec["foundWebsite"] = True
        rec["websiteUrl"] = rec["candidateProbe"].get("finalUrl") or best["url"]
        if best["score"] >= 8 and best["hits"] >= 2 and live:
            rec["confidence"] = "high"
        elif best["score"] >= 6 and live:
            rec["confidence"] = "med"
        else:
            rec["confidence"] = "low"
        if not live:
            rec["notes"].append(
                f"discovered domain {best['domain']} not live "
                f"({rec['candidateProbe']['note']})")
        if best["builder"]:
            rec["notes"].append(f"{best['domain']} is a hosted-builder page")

    # -- classify --
    rec["classification"] = classify(rec)
    if rec["searchError"]:
        rec["notes"].append(f"search failed: {rec['searchError']}")
    return rec


def classify(rec):
    pipeline_real = rec["pipelineHasRealSite"]
    pw_probe = rec.get("pipelineUrlProbe") or {}
    pw_alive = pw_probe.get("alive")
    found = rec["foundWebsite"]
    fnd_alive = (rec.get("candidateProbe") or {}).get("alive")

    if rec["searchOk"] is False and not pipeline_real:
        return "needs-review"  # couldn't verify a "no website" company

    if pipeline_real:
        if pw_alive is False:
            if found and fnd_alive:
                return "has-site-listed-dead-but-alt-found"
            return "has-site-wrong-or-dead"
        if rec["pipelineAnnotatedDead"]:
            # scout flagged it dead but our probe now sees it — annotation may be
            # stale, or the 200 is a parking/suspended page. Eyeball it.
            return "needs-review"
        if pw_alive is True:
            return "confirmed-has-site"
        return "needs-review"  # listed real site, probe inconclusive

    # pipeline says NO prospect website (empty, note-only, or our demo build)
    if found and fnd_alive:
        return "misclassified-has-website"
    if found and not fnd_alive:
        return "needs-review"  # candidate found but dead
    if rec["searchOk"]:
        return "confirmed-no-site"
    return "needs-review"


# --------------------------------------------------------------------------- #
def load_out():
    if os.path.exists(OUT):
        try:
            return json.load(open(OUT))
        except Exception:
            pass
    return {"generatedAt": None, "backend": "", "summary": {}, "results": {}}


def summarize(store):
    from collections import Counter
    c = Counter(r["classification"] for r in store["results"].values())
    total = len(store["results"])
    misclassified = [r["id"] for r in store["results"].values()
                     if r["classification"] == "misclassified-has-website"]
    wrong_dead = [r["id"] for r in store["results"].values()
                  if r["classification"] in ("has-site-wrong-or-dead",
                                              "has-site-listed-dead-but-alt-found")]
    review = [r["id"] for r in store["results"].values()
              if r["classification"] == "needs-review"]
    return {
        "verified": total,
        "byClassification": dict(c),
        "noWebsite_butActuallyHasOne": {"count": len(misclassified), "ids": misclassified},
        "hasWebsite_butWrongOrDead": {"count": len(wrong_dead), "ids": wrong_dead},
        "needsManualReview": {"count": len(review), "ids": review},
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sleep", type=float, default=12.0)
    ap.add_argument("--batch", type=int, default=12,
                    help="extra cooldown every N calls")
    ap.add_argument("--cooldown", type=float, default=90.0)
    ap.add_argument("--limit", type=int, default=0, help="max companies this run")
    ap.add_argument("--only", default="", help="comma-separated ids")
    ap.add_argument("--force", action="store_true", help="redo already-done")
    ap.add_argument("--retry-errors", action="store_true")
    ap.add_argument("--no-search", action="store_true",
                    help="baseline + liveness only, skip web search")
    ap.add_argument("--summary", action="store_true",
                    help="recompute summary from existing file and exit")
    args = ap.parse_args()

    pipeline = json.load(open(PIPELINE))
    companies = pipeline["companies"]
    store = load_out()

    if args.summary:
        store["summary"] = summarize(store)
        json.dump(store, open(OUT, "w"), indent=2)
        print(json.dumps(store["summary"], indent=2))
        return

    only = {s.strip() for s in args.only.split(",") if s.strip()}
    done = 0
    for co in companies:
        cid = co.get("id")
        if only and cid not in only:
            continue
        existing = store["results"].get(cid)
        if existing and not args.force and not only:
            if args.retry_errors:
                if existing.get("searchOk") is not False and \
                   existing.get("classification") != "needs-review":
                    continue
            else:
                continue
        rec = verify_company(co, do_search=not args.no_search)
        store["results"][cid] = rec
        store["generatedAt"] = dt.datetime.utcnow().isoformat() + "Z"
        store["backend"] = (
            f"ll-research search (OpenSERP @ {DROPLET}:7000) + HTTP liveness probe"
        )
        store["summary"] = summarize(store)
        json.dump(store, open(OUT, "w"), indent=2)
        done += 1
        print(f"[{done:>3}] {cid:<38} {rec['classification']:<34} "
              f"found={rec['foundWebsite']} conf={rec['confidence']} "
              f"err={rec['searchError'] or '-'}")
        if args.limit and done >= args.limit:
            break
        time.sleep(args.sleep)
        if args.batch and done % args.batch == 0:
            print(f"  ... cooldown {args.cooldown}s (IP rate-limit courtesy)")
            time.sleep(args.cooldown)

    store["summary"] = summarize(store)
    json.dump(store, open(OUT, "w"), indent=2)
    print("\n=== SUMMARY ===")
    print(json.dumps(store["summary"], indent=2))
    print(f"\nwritten: {OUT}")


if __name__ == "__main__":
    main()
