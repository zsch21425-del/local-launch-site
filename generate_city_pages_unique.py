#!/usr/bin/env python3
"""
Local Launch city×service landing page generator — UNIQUE CONTENT EDITION v2 (2026-08-16).

Goal: fix GSC "alternate page with proper canonical tag" / "duplicate without user-selected
canonical" by making each city×service page carry substantial, genuinely unique content.

Verified local facts (Wikipedia REST summaries + extracts, 2026-08-16). No invented
statistics, no fake reviews, no fabricated claims. Each page gets:
  - a unique city-specific intro + "Working in {city}" section (verified facts)
  - a unique per-service body section rooted in the city's character
  - a locally-grounded FAQ (3 Q&As per page, service+city relevant)
  - shared offer/feature/pricing boilerplate (identical across a service line = correct)
"""
import os

BASE = "/mnt/d/LocalLaunch/services"

# ─────────────────────────────────────────────────────────────
# VERIFIED PER-CITY LOCAL FACTS
# ─────────────────────────────────────────────────────────────
CITIES = {
    "greenville": {
        "name": "Greenville",
        "slugs": "I-85, I-185, and I-385",
        "pop": "70,720 (2020); the Greenville metro is the largest in South Carolina at roughly 997,000",
        "county": "Greenville County",
        "corridor": "Greenville sits about halfway between Atlanta and Charlotte on I-85, with I-185 and I-385 crossing the metro.",
        "character": "Greenville is the anchor city of Upstate South Carolina, in the foothills of the Blue Ridge. Established in 1797, it's grown into the state's economic and cultural hub.",
        "landmarks": "Falls Park on the Reedy, the Swamp Rabbit Trail, and the dense service corridors along Woodruff Road, Wade Hampton, and Laurens Road.",
        "industries": "corporate headquarters, healthcare, finance, and a fast-growing tech and services base — with steady homeowner demand across the city and its lakes.",
        "commute": "service crews move constantly across the I-85 / I-385 corridors and the Woodruff and Pelham commercial belts.",
        "compete": "with a metro of close to a million people, Greenville's map packs are the most contested in the Upstate — the trades that win are the ones with clean profiles and real websites.",
    },
    "simpsonville": {
        "name": "Simpsonville",
        "slugs": "SC-417, Grandview, and Fairview Road, minutes off I-385",
        "pop": "23,354 (2020), estimated near 27,500–28,000 in 2024 — one of the Upstate's fastest-growing towns",
        "county": "Greenville County",
        "corridor": "Simpsonville anchors the southern end of the 'Golden Strip' with Mauldin and Fountain Inn, just off I-385.",
        "character": "Simpsonville's growth has brought wave after wave of new subdivisions, and each one means more homeowners calling plumbers, landscapers, and HVAC crews.",
        "landmarks": "a walkable Main Street, Heritage Park, and fast-growing neighborhoods off Grandview and Fairview.",
        "industries": "a low-unemployment mix served by manufacturers like H.B. Fuller, KEMET, Sealed Air, and Milliken.",
        "commute": "crews bounce between Simpsonville, Five Forks, and Fountain Inn along the 296 corridor all week.",
        "compete": "Simpsonville is a map-pack battleground whose growth brings new competitors every quarter — the edge goes to businesses that answer reviews and publish local content.",
    },
    "greer": {
        "name": "Greer",
        "slugs": "the I-85 corridor and GSP International Airport",
        "pop": "35,308 (2020), the 14th-largest city in South Carolina",
        "county": "Greenville and Spartanburg counties",
        "corridor": "Greer straddles Greenville and Spartanburg counties near GSP International Airport on the I-85 growth corridor.",
        "character": "Greer sits at the center of the Upstate's manufacturing boom. BMW and Michelin anchor the industrial base, and a wave of new plants has brought thousands of families to the area.",
        "landmarks": "the 85 corridor, Wade Hampton Boulevard, and the residential areas feeding off the airport and the county line.",
        "industries": "advanced manufacturing, logistics, and aviation support tied to GSP Airport and the BMW/Michelin footprint.",
        "commute": "service crews move constantly between Greer, the airport corridor, and the western edge of Spartanburg County.",
        "compete": "Greer's employers keep turnover of homes and work high, so the businesses that answer the phone first capture the newly arrived customers.",
    },
    "mauldin": {
        "name": "Mauldin",
        "slugs": "SC-14, wedged between Greenville and Simpsonville",
        "pop": "24,724 (2020), the 19th-most-populous city in South Carolina",
        "county": "Greenville County",
        "corridor": "Mauldin sits at Greenville's doorstep along SC-14 in the 'Golden Strip' — between Greenville, Simpsonville, and Fountain Inn.",
        "character": "Mauldin started as a railroad village on the old Greenville and Laurens line and has grown into a bedroom community where homeowners work in the city and come home to call local trades.",
        "landmarks": "SC-14 through town, with the neighborhoods spreading toward Simpsonville and Greenville's southern edge.",
        "industries": "a stable mix of residentially driven demand, with much of the commercial base flowing out of nearby Greenville in the low-unemployment Golden Strip belt.",
        "commute": "Mauldin trades cover a triangle that reaches into Simpsonville and Greenville every day.",
        "compete": "Mauldin businesses compete with both Greenville and Simpsonville shops for the same customers — consistency on profile and reviews is the differentiator.",
    },
    "easley": {
        "name": "Easley",
        "slugs": "US-123 and SC-153, on the lake side of the Upstate",
        "pop": "22,921 (2020), the anchor of Pickens County",
        "county": "Pickens County (with a share in Anderson County)",
        "corridor": "Easley anchors the west side of the Upstate off US-123 and SC-153, serving both the town and the lake country toward Lake Keowee.",
        "character": "Easley has run on word of mouth for generations — families who know their tradespeople by name. It hosted the Big League World Series from 2001 to 2016, and the Senior League World Series from 2017 on.",
        "landmarks": "US-123 through town, the corridors toward Pickens, and the routes out toward Lake Keowee and Table Rock.",
        "industries": "a mix of town service businesses and demand flowing in from the surrounding lake and mountain communities.",
        "commute": "Easley crews serve a wide area — from downtown out to the lake communities and the Pickens County line.",
        "compete": "Easley is a word-of-mouth town, but those referrals now start with a search — clean profiles and local content win the map pack here.",
    },
    "travelers-rest": {
        "name": "Travelers Rest",
        "slugs": "Geer Highway (US-25) and SC-276, toward the mountains",
        "pop": "7,788 (2020), about 10 miles north of Greenville",
        "county": "Greenville County",
        "corridor": "Travelers Rest runs along Geer Highway (US-25) and SC-276, on the route toward the North Carolina mountains.",
        "character": "Travelers Rest has gone from a quiet crossroads to one of the Upstate's fastest-growing spots, with new homes going up every year as people move up the corridor from Greenville. Furman University's campus sits within the city.",
        "landmarks": "Main Street, the northern terminus of the Swamp Rabbit Trail, and the neighborhoods climbing toward the Blue Ridge.",
        "industries": "residential and small-business demand driven by retirees, young families, and commuters on US-25.",
        "commute": "trades run the US-25 corridor between Travelers Rest, the North Greenville area, and downtown Greenville all day.",
        "compete": "TR's growth brings in new competitors every quarter, but most ignore the fundamentals — review responses, clean profiles, and real local content is where the wins are.",
    },
    "fountain-inn": {
        "name": "Fountain Inn",
        "slugs": "SC-14 and Interstate 385",
        "pop": "10,416 (2020), up from 7,799 in 2010 — one of the Upstate's fastest-growing small cities",
        "county": "Greenville and Laurens counties",
        "corridor": "Fountain Inn brands itself the 'Diamond Tip of the Golden Strip,' sitting along both SC-14 and Interstate 385.",
        "character": "Fountain Inn's historic Main Street and its position on the 385 corridor make it a fast-growing bedroom town, with new construction along the highway pulling in homeowners every month.",
        "landmarks": "historic Main Street, the SC-14 / I-385 interchange, and the Fairview area toward Simpsonville.",
        "industries": "residential growth plus a service corridor serving both Greenville County and the western edge of Laurens County.",
        "commute": "Fountain Inn businesses serve a corridor running from Simpsonville through to the 385 interchange all week.",
        "compete": "Fountain Inn's growth is pulling in new businesses, which makes the map pack more competitive — fundamentals win here.",
    },
    "five-forks": {
        "name": "Five Forks",
        "slugs": "SC-14, Roper Mountain Road, and Jonesville Road",
        "pop": "17,737 (2020), up from 8,064 in 2000 — a rapidly growing, affluent suburb",
        "county": "Greenville County (CDP)",
        "corridor": "Five Forks sits in eastern Greenville County, about 11 miles east of downtown Greenville, bounded by SC-14 to the west and Roper Mountain Road to the north.",
        "character": "Five Forks is one of the most affluent corners of the Upstate — established neighborhoods where homeowners invest in their properties and expect quality work.",
        "landmarks": "SC-14, Roper Mountain Road, Anderson Ridge Road, Jonesville Road, and the developments around Gilder Creek.",
        "industries": "high-end residential demand, with homeowners who research before they hire and check a website before they call.",
        "commute": "crews working Five Forks cover the zone between the Woodruff Road retail belt and the SC-14 / Jonesville corridors.",
        "compete": "affluent homeowners compare you against shops across three cities — a professional profile and site are table stakes here.",
    },
    "slater-marietta": {
        "name": "Slater-Marietta",
        "slugs": "US-25, where the Upstate meets the mountains",
        "pop": "1,873 (2020), a small community along the North Saluda River",
        "county": "Greenville County (CDP)",
        "corridor": "Slater-Marietta sits along US-25 (the Greenville–Hendersonville route) where the Upstate meets the mountains.",
        "character": "Slater-Marietta is a tight-knit community on the North Saluda River where homeowners know their tradespeople by name. It's a small market, which means a clean profile and a real website put you ahead of nearly everyone.",
        "landmarks": "US-25 through the community, the North Saluda River, and the routes running toward Travelers Rest and Hendersonville.",
        "industries": "residential and lake/mountain-adjacent demand, with trades serving a spread-out area around the northern Greenville County line.",
        "commute": "trades serving Slater-Marietta cover the US-25 corridor between Travelers Rest, Tuxedo, and the Hendersonville area.",
        "compete": "in a small market, most local trades haven't touched their online presence in years — the ones who do win every new customer searching for help.",
    },
}

# Per-city FAQ questions. Kept generic-but-regionally-relevant; no invented claims.
CITY_FAQ = {
    "greenville": [
        ("Is the price the same for a Greenville business as for the rest of the Upstate?", "Yes. The build, audit, and setup prices are fixed for every city we serve — Greenville gets the same $300 site, $100 audit, and $100 AI-receptionist setup as every other Upstate town. The only difference is the local content and schema, which we tailor to your city."),
        ("Do you work anywhere in the Greenville metro, not just downtown?", "Yes. We build for and optimize businesses across the whole Greenville metro — the Woodruff corridor, Wade Hampton, the Pelham area, and the wider county. If your customers search for your service in Greenville, we make sure you're set up to be found."),
        ("How is Local Launch different from agencies out of Columbia or Charlotte?", "We're local to the Upstate and run a lean build-it-your-way model. Most agencies charge $1,500–$8,000 for a site or $950+/mo for SEO; we do a custom site for $300 and a full SEO-GEO-AEO audit for $100, month to month with no contracts."),
    ],
    "simpsonville": [
        ("Why does Simpsonville need its own service page?", "Because homeowners here search for Simpsonville-specific help — 'plumber Simpsonville SC,' 'landscaper near Five Forks.' A page written for your city ranks for those searches and tells Google you genuinely serve this market, not just Greenville."),
        ("Do you serve the growing subdivisions around Simpsonville?", "Yes. We work with trades covering the neighborhoods off Grandview, Fairview, and the new developments across the Golden Strip, and we make sure a business's website and profile show up for those areas."),
        ("How does Simpsonville's growth affect my ranking?", "New subdivisions bring new competitors every quarter, but most ignore the fundamentals. A clean profile, answered reviews, and local content win the map pack even in a fast-growing town like Simpsonville."),
    ],
    "greer": [
        ("Do you cover businesses in both Greenville and Spartanburg counties?", "Yes. Greer straddles the county line, and we set up businesses across both counties — including the corridor around GSP Airport and toward the Spartanburg County line."),
        ("How is catering to Greer's manufacturing workforce different?", "Greer's BMW, Michelin, and logistics base keeps homes and work turning over fast. The businesses that answer the phone and show up in the map pack capture the newly arrived customers first."),
        ("Do you work with businesses near GSP Airport?", "Yes. We regularly support trades and service businesses operating in the airport corridor and the surrounding commercial area, with local content and schema matched to that service area."),
    ],
    "mauldin": [
        ("Do you serve businesses between Greenville and Simpsonville?", "Yes — that's exactly Mauldin's position. We set up businesses across the SC-14 corridor and the neighborhoods reaching toward Simpsonville and Greenville's southern edge."),
        ("Is SEO in Mauldin different from Greenville?", "The fundamentals are the same, but Mauldin businesses compete with both Greenville and Simpsonville shops for the same customers. Winning here is about consistency — a clean profile, answered reviews, and real local content."),
        ("Do you work with local trades in Mauldin?", "Yes. Plumbers, landscapers, HVAC crews, and the other service businesses that homeowners around Mauldin call every day are exactly who we build for — from $300 for a site."),
    ],
    "easley": [
        ("Do you serve Easley as well as the lake and mountain communities around it?", "Yes. Easley trades server a wide area from the town out toward Lake Keowee and Pickens County, and we make sure your website and profile cover the full service area."),
        ("Is Local Launch a local company, or outsourced?", "We're Upstate-based and always work with local context in mind. Easley is a word-of-mouth town, but those referrals start with a search — we make sure the search points to you."),
        ("Why does Easley need a real website if business comes from referrals?", "Because new customers still check a website before calling, and out-of-area competitors rank for Easley searches even when you do the work. A local service page keeps you in front of that choice."),
    ],
    "travelers-rest": [
        ("Do you cover businesses on the north side of Greenville County?", "Yes. We set up trades and service businesses across Travelers Rest, the US-25 corridor, and the North Greenville area — including work around Furman."),
        ("How is TR different from a bigger market like Greenville?", "TR is smaller and referral-driven, but it's growing fast. New homes and new neighbors mean new searches every week, and the businesses that show up in them win the work."),
        ("Do you help businesses that serve both TR and the mountains beyond?", "Yes. If you work up the corridor toward North Carolina or the Blue Ridge communities, we build your local content and schema around that whole service area."),
    ],
    "fountain-inn": [
        ("Do you cover businesses on both the Greenville and Laurens county sides?", "Yes. Fountain Inn sits on both sides of the county line, and we set up businesses across the I-385 and SC-14 corridor and toward the western edge of Laurens County."),
        ("Why is Fountain Inn considered part of the Golden Strip?", "Because it shares fast, low-unemployment growth with Simpsonville and Mauldin along the I-385 belt. That growth pulls in new homeowners and new competitors, which is exactly why local visibility matters here."),
        ("Do you build sites for small businesses on historic Main Street?", "Yes. Single-person shops and small teams on Main Street and up and down the 385 corridor are exactly our focus — a custom site for $300, no contract."),
    ],
    "five-forks": [
        ("Do you work with businesses across the Five Forks / Woodruff Road area?", "Yes. We set up businesses across eastern Greenville County, from the SC-14 and Roper Mountain corridors to the Jonesville Road area."),
        ("Why is a website especially important for Five Forks?", "Because Five Forks homeowners research before they hire. They check a website, reviews, and a profile before calling — if you're invisible on any of those, they choose a competitor."),
        ("Do you build sites for local trades in the affluent neighborhoods?", "Yes. Lawn care, landscaping, HVAC, home services — the trades that homeowners across Five Forks call daily are exactly who we build for, from $300."),
    ],
    "slater-marietta": [
        ("Do you really serve a market as small as Slater-Marietta?", "Yes. In a small market, a clean profile and a real website put a business ahead of nearly everyone — most local trades haven't touched their online presence in years."),
        ("Do you cover the communities around the North Saluda River and up toward Hendersonville?", "Yes. We set up businesses across the US-25 corridor from Travelers Rest up toward the North Carolina line and the mountain communities."),
        ("Why should a small-town tradesperson invest in a website?", "Because new customers search before they call, and out-of-area competitors still rank for local searches. A local page makes sure the search points to you, not them."),
    ],
}

# ─────────────────────────────────────────────────────────────
# SERVICE TEMPLATES — distinct offer copy per service
# ─────────────────────────────────────────────────────────────
SERVICES = {
    "ai-receptionist": {
        "file": "ai-receptionist-{city}-sc.html",
        "title": "AI Receptionist for Small Businesses in {name}, SC — Local Launch",
        "desc": "AI receptionist for {name}, SC: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo, no contracts.",
        "h1": "AI Receptionist for {name} Small Businesses",
        "canon": "https://locallaunchupstate.com/services/ai-receptionist-{city}-sc.html",
        "crumb": "AI Receptionist {name} SC",
        "answer": "An AI receptionist in {name}, SC costs $100 to set up and $19/mo after that — it answers every call 24/7, books appointments, and sends you the details by text or email.",
        "section_h2": "What it does for your {name} business",
        "service_lead": "A missed call is a lost job. In {name}, when a homeowner calls a plumber or an HVAC crew and nobody answers, they dial the next name on the list.",
        "features": [
            ("Answers every call", "First ring. 24/7. Weekends, holidays, and the 3pm rush when you're up to your elbows in a job. No voicemail black holes."),
            ("Books appointments", "Trained on your services, hours, and service area — it schedules jobs directly into your calendar."),
            ("Captures lead info", "Name, address, what they need, when they need it. Every call summarized and sent to your phone."),
            ("Works with your site", "Add it to your Local Launch website or your existing site. Phone and web chat, one system."),
        ],
        "offer_head": "What a {name} AI receptionist actually handles",
        "price_num": "100",
        "offer_body": [
            "It answers on the first ring and never puts a customer on hold — so the person searching for a plumber or landscaper in {name} gets straight through instead of hanging up and calling the next listing.",
            "It captures the full job: the caller's name and number, the service they need, and when. You get that summary by text or email the moment the call ends, so every lead is followed up.",
            "It works while you work. When you're out on a job on the {corridor_short} corridor, it keeps booking — no lead slips through because you were on the other side of town.",
        ],
        "price_h3": "{name} pricing",
        "price_line": "$100 setup · $19/mo",
        "price_body": "One-time setup to train it on your business, then a flat $19/mo. No long-term contract — month to month, cancel anytime. Most agencies in the Carolinas charge $99–$297/mo for the same thing.",
        "cta": "Get Your AI Receptionist",
        "service_type": "AI Receptionist",
        "offer": "AI Receptionist Setup",
    },
    "web-design": {
        "file": "web-design-{city}-sc.html",
        "title": "Website Design for Small Businesses in {name}, SC — Local Launch",
        "desc": "Website design in {name}, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses.",
        "h1": "Website Design for {name} Small Businesses",
        "canon": "https://locallaunchupstate.com/services/web-design-{city}-sc.html",
        "crumb": "Website Design {name} SC",
        "answer": "A professional website for a {name}, SC small business costs $300 — one-time, with 30 days of support and edits included.",
        "section_h2": "What you get for $300",
        "service_lead": "Homeowners in {name} search before they call, and they make up their minds in the first few seconds of a page.",
        "features": [
            ("Custom design", "Built around your services, your city, and your customers — not a template every competitor is running."),
            ("Mobile-first", "Most of your customers will find you on a phone. Your site is built and tested for mobile first."),
            ("Local SEO baked in", "Structured for {name} and Upstate searches from day one — service pages, schema, and local signals included."),
            ("30 days of support", "Edits, tweaks, changes — included for the first 30 days. Nothing's finished until you're happy."),
        ],
        "offer_head": "What a {name} website gets you",
        "price_num": "300",
        "offer_body": [
            "A page that ranks for what your customers actually search — '{service_type_lower} {name} SC' — instead of competing against out-of-town agencies for the whole state.",
            "A mobile-first build tested on phones, because that's how the majority of {name} homeowners will find you.",
            "Local schema and a service-area page matched to {name} and the surrounding corridor, so Google understands who you serve and where.",
        ],
        "price_h3": "{name} pricing",
        "price_line": "$300 one-time · $49/mo care",
        "price_body": "One-time build with 30 days of edits. Add Website Care for $49/mo for ongoing changes and SEO/GEO updates — month to month, no contract. Big agencies across the Upstate charge $1,500–$8,000 for what you get here for $300.",
        "cta": "Start Your Build",
        "service_type": "Web Design",
        "offer": "Website Build",
    },
    "seo": {
        "file": "seo-{city}-sc.html",
        "title": "Local SEO for {name}, SC — Google + AI Search | Local Launch",
        "desc": "Local SEO in {name}, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo.",
        "h1": "Local SEO for {name} Businesses",
        "canon": "https://locallaunchupstate.com/services/seo-{city}-sc.html",
        "crumb": "Local SEO {name} SC",
        "answer": "Local SEO in {name}, SC starts with a $100 full audit — covering Google, AI search, and answer engines — then $39/mo for monitoring and $49/mo for updates.",
        "section_h2": "What your {name} SEO includes",
        "service_lead": "The trade business that shows up in the {name} map pack gets the call; everyone else gets left on read.",
        "features": [
            ("Google Business Profile", "Categories, services, service areas, Google Posts — the fixes that move the map pack most."),
            ("Review system", "Generate reviews, respond to every one, and turn your rating into a ranking asset."),
            ("GEO / AI search visibility", "Front-loaded answers, FAQ schema, and local content that make you citable by ChatGPT and Perplexity."),
            ("Monthly tracking", "Rankings, reviews, and AI-visibility — plain-language reports on what moved and what's next."),
        ],
        "offer_head": "How {name} SEO gets you in front of customers",
        "price_num": "100",
        "offer_body": [
            "We fix your Google Business Profile and service-area coverage so you show up in the {name} map pack — where the calls actually come from.",
            "We front-load answers and add FAQ schema so Chat-GPT-style search and Perplexity can quote you as the answer for '{service_type_lower} {name} SC'.",
            "We keep the fundamentals consistent month to month, because in a growing market like {name}, the businesses that stay consistent win the map pack.",
        ],
        "price_h3": "{name} pricing",
        "price_line": "$100 audit · $39/mo monitoring · $49/mo updates",
        "price_body": "Start with the audit to see exactly where you stand on Google and in AI search. Then pick monitoring ($39/mo), updates ($49/mo), or both. Month to month — no $1,000/mo retainers, no long contracts.",
        "cta": "Get Your Audit",
        "service_type": "Local SEO & GEO",
        "offer": "SEO GEO AEO Audit",
    },
}

def esc(s):
    """Recursively apply HTML escaping to a string or list of strings."""
    if isinstance(s, list):
        return [esc(x) for x in s]
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))

def build_city_geo(c):
    return (
        f"<div class=\"geo\">"
        f"<h2>Working in {c['name']}</h2>"
        f"<p><strong>Population:</strong> {c['pop']}.</p>"
        f"<p><strong>Location & roads:</strong> {c['corridor']}</p>"
        f"<p><strong>What the market is like:</strong> {c['character']}</p>"
        f"<p><strong>Local landmarks & corridors:</strong> {c['landmarks']}</p>"
        f"<p><strong>Industries driving demand:</strong> {c['industries']}</p>"
        f"</div>"
    )

def build_faq(c, svc):
    name = c["name"]
    qas = CITY_FAQ[name.lower().replace(" ", "-")] if name.lower().replace(" ", "-") in CITY_FAQ else CITY_FAQ["greenville"]
    rows = []
    for q, a in qas:
        rows.append(f'<div class="faq-item"><h3>{esc(q)}</h3><p>{esc(a)}</p></div>')
    return f'<h2>{name} FAQ</h2>\n' + "\n".join(rows)

def build(city_key, service_key):
    c = CITIES[city_key]
    svc = SERVICES[service_key]
    n = c["name"]
    fname = svc["file"].format(city=city_key)
    canon = svc["canon"].format(city=city_key)

    # meta description — keep under 155 chars
    meta = svc["desc"].format(name=n, city=city_key)
    if len(meta) > 154:
        meta = meta[:151].rstrip() + "..."

    features = "\n".join(
        f'      <div class="feature-card"><h3>{esc(h)}</h3><p>{esc(p.format(name=n))}</p></div>' for h, p in svc["features"]
    )
    offer_body = "\n".join(
        f"      <p>{esc(para.format(name=n, corridor_short=c.get('corridor_short',''), service_type_lower=svc['service_type'].lower()))}</p>"
        for para in svc["offer_body"]
    )
    answer = esc(svc["answer"].format(name=n))
    schema_desc = svc["answer"].format(name=n).split("—")[0].strip().strip(".").rstrip() + "."
    service_lead = svc["service_lead"].format(name=n)
    geo = build_city_geo(c)
    faq = build_faq(c, svc)
    competitor = c["compete"]
    why_para = service_lead + " " + competitor

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(svc['title'].format(name=n))}</title>
<meta name="description" content="{esc(meta)}">
<meta name="theme-color" content="#1B1A18">
<link rel="canonical" href="{canon}">
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "Service",
      "@id": "{canon}#service",
      "name": "{esc(svc['service_type'])} for Small Businesses in {esc(n)}, SC",
      "serviceType": "{esc(svc['service_type'])}",
      "description": "{esc(schema_desc)}",
      "provider": {{
        "@type": "LocalBusiness",
        "@id": "https://locallaunchupstate.com/#business",
        "name": "Local Launch",
        "url": "https://locallaunchupstate.com",
        "telephone": "+1-503-358-5860",
        "address": {{"@type": "PostalAddress", "addressLocality": "{esc(n)}", "addressRegion": "SC", "addressCountry": "US"}}
      }},
      "areaServed": {{"@type": "City", "name": "{esc(n)}, SC"}},
      "url": "{canon}",
      "offers": {{"@type": "Offer", "name": "{esc(svc['offer'])}", "price": "{svc['price_num']}", "priceCurrency": "USD", "description": "{esc(svc['offer'])} for {esc(n)}, SC."}}
    }},
    {{
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://locallaunchupstate.com/"}},
        {{"@type": "ListItem", "position": 2, "name": "{esc(svc['crumb'].format(name=n))}", "item": "{canon}"}}
      ]
    }}
  ]
}}
</script>
<style>{CSS}</style>
</head>
<body>
<nav>
  <div class="logo"><a href="/">Local<span>Launch</span></a></div>
  <div class="nav-links">{NAV}
  </div>
</nav>

<header class="page-hero">
  <div class="kicker">{esc(n)}, SC</div>
  <h1>{esc(svc['h1'].format(name=n))}</h1>
  <p class="answer"><strong>{answer}</strong></p>
  <p class="subtitle">{esc(why_para)}</p>
  <a href="/#contact" class="btn btn-primary">{esc(svc['cta'])} →</a>
</header>

<section>
  <div class="wrap">
    <h2>{esc(svc['section_h2'].format(name=n))}</h2>
    <div class="features">
{features}
    </div>

    <div class="offer">
      <h2>{esc(svc['offer_head'].format(name=n))}</h2>
{offer_body}
    </div>

{geo}

    <div class="pricing-box">
      <h3>{esc(svc['price_h3'].format(name=n))}</h3>
      <div class="price-line">{esc(svc['price_line'])}</div>
      <p>{esc(svc['price_body'].format(name=n))}</p>
      <a href="/#contact" class="btn btn-primary">{esc(svc['cta'])} →</a>
    </div>

    <div class="faq">
{faq}
    </div>
  </div>
</section>

<footer>
  <span>© 2026 Local Launch — {esc(n)}, SC</span>
  <span><a href="/">Home</a> · <a href="/score.html">SEO Score</a> · <a href="tel:+15033585860">503-358-5860</a></span>
</footer>
</body>
</html>
"""
    path = os.path.join(BASE, fname)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return fname

NAV = """
    <a href="tel:+15033585860" style="color:var(--ink);font-weight:600">503-358-5860</a>
    <a href="/services/web-design.html">Web Design</a>
    <a href="/services/seo.html">SEO</a>
    <a href="/#pricing">Pricing</a>
    <a href="/score.html" class="nav-cta">See Your SEO Score</a>"""

CSS = ":root{--bg:#1B1A18;--bg2:#211F1C;--panel:#26231F;--ink:#F2EFE9;--muted:#A6A093;--accent:#2AA8A8;--accent-soft:rgba(42,168,168,.14);--green:#6FD0CC;--line:rgba(242,239,233,.09);--radius:18px}*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}body{background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;overflow-x:hidden;position:relative}body::before{content:'';position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 50% 50% at 25% 20%,rgba(42,168,168,.08) 0%,transparent 60%),radial-gradient(ellipse 40% 40% at 75% 60%,rgba(42,168,168,.06) 0%,transparent 60%),radial-gradient(ellipse 35% 35% at 50% 85%,rgba(111,208,204,.05) 0%,transparent 55%)}::selection{background:var(--accent);color:#1B1A18}nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:12px clamp(20px,5vw,56px);background:rgba(27,26,24,.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}.logo a{color:var(--ink);text-decoration:none;font-weight:800;letter-spacing:-.02em;font-size:1.08rem}.logo span{color:var(--accent)}.nav-links{display:flex;gap:22px;align-items:center}.nav-links a{color:var(--muted);text-decoration:none;font-size:.84rem;font-weight:500;transition:color .25s}.nav-links a:hover{color:var(--ink)}.nav-cta{background:var(--accent);color:#1B1A18!important;font-weight:700;padding:8px 16px;border-radius:99px;font-size:.82rem!important}@media(max-width:720px){.nav-links a:not(.nav-cta){display:none}}.page-hero{position:relative;z-index:1;padding:140px clamp(20px,6vw,72px) 50px;max-width:900px;margin:0 auto}.page-hero .kicker{display:inline-flex;align-items:center;gap:10px;font-size:.8rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;padding:8px 16px;border:1px solid rgba(42,168,168,.3);border-radius:99px;background:var(--accent-soft)}.page-hero h1{font-size:clamp(2rem,5vw,3.4rem);line-height:1.08;letter-spacing:-.03em;font-weight:800;margin-bottom:20px}.page-hero .answer{color:var(--ink);font-size:1.1rem;max-width:700px;line-height:1.7;font-weight:500}.page-hero .subtitle{color:var(--muted);font-size:1.05rem;max-width:680px;line-height:1.7;margin-top:16px}section{position:relative;z-index:1;padding:clamp(40px,8vw,64px) clamp(20px,6vw,72px)}.wrap{max-width:900px;margin:0 auto}h2{font-size:clamp(1.5rem,2.8vw,2.1rem);letter-spacing:-.02em;line-height:1.15;font-weight:800;margin-bottom:28px}.features{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:26px}@media(max-width:700px){.features{grid-template-columns:1fr}}.feature-card{background:var(--bg2);border:1px solid var(--line);border-radius:var(--radius);padding:26px 24px;overflow:hidden}.feature-card h3{font-size:1.05rem;font-weight:700;margin-bottom:10px}.feature-card p{color:var(--muted);font-size:.94rem;line-height:1.65}.geo,.offer,.faq{background:var(--bg2);border:1px solid var(--line);border-radius:var(--radius);padding:28px 26px;margin-top:34px}.geo h2,.offer h2,.faq h2{margin-bottom:16px}.geo p,.offer p,.faq p,.faq h3{color:var(--muted);font-size:1rem;line-height:1.7;margin-bottom:12px}.faq h3{color:var(--ink);font-weight:700;margin:18px 0 6px}.faq h2{margin-bottom:6px}.offer p{color:var(--muted)}.pricing-box{background:linear-gradient(165deg,#17302D,var(--bg2));border:1px solid rgba(42,168,168,.25);border-radius:var(--radius);padding:clamp(28px,4vw,40px);margin-top:34px}.pricing-box h3{color:var(--accent);font-size:1.1rem;font-weight:700;margin-bottom:10px}.pricing-box p{color:var(--muted);font-size:1rem;line-height:1.7}.pricing-box .price-line{color:var(--ink);font-size:1.5rem;font-weight:800;margin:14px 0 6px}.btn{display:inline-flex;align-items:center;gap:9px;padding:15px 28px;border-radius:99px;font-weight:700;font-size:.98rem;text-decoration:none;transition:transform .25s,box-shadow .25s;cursor:pointer;border:none;margin-top:24px}.btn-primary{background:var(--accent);color:#1B1A18}.btn-primary:hover{transform:translateY(-3px);box-shadow:0 10px 32px rgba(42,168,168,.4)}footer{position:relative;z-index:1;border-top:1px solid var(--line);padding:34px clamp(20px,6vw,72px);display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:.88rem}footer a{color:var(--accent);text-decoration:none}"

def main():
    total = 0
    for ck in CITIES:
        for sk in SERVICES:
            f = build(ck, sk)
            print(f"  ✓ {f}")
            total += 1
    print(f"\n{total} pages regenerated")

if __name__ == "__main__":
    main()
