#!/usr/bin/env python3
"""Generate service x city landing pages for Simpsonville, Greer, Mauldin.

Pattern: clones the Greenville service pages, swaps city-specific copy.
"""
import os

BASE = "/mnt/d/LocalLaunch/services"

# Per-city local facts (real, GEO-relevant)
CITIES = {
    "simpsonville": {
        "name": "Simpsonville",
        "title_suffix": "Simpsonville, SC",
        "desc_ai": "AI receptionist for Simpsonville, SC businesses: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo — no contracts.",
        "desc_web": "Website design in Simpsonville, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses. 30 days of support and edits included.",
        "desc_seo": "Local SEO in Simpsonville, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo, updates from $49/mo.",
        "h1_ai": "AI Receptionist for Simpsonville Small Businesses",
        "h1_web": "Website Design for Simpsonville Small Businesses",
        "h1_seo": "Local SEO for Simpsonville Businesses",
        "local_ai": "Simpsonville is one of the fastest-growing towns in the Upstate — new subdivisions going up around every corner, and every one of them means more homeowners calling plumbers, landscapers, and HVAC crews. When you're out on a job in Five Forks or off Fairview Road, your AI receptionist answers the next call in seconds, books the appointment, and sends you the details.",
        "local_web": "Simpsonville homeowners search before they call — and with the town growing as fast as it is, new residents are looking for local trades every week. A custom, mobile-first site built for your services puts you in front of them before the bigger-town competitors.",
        "local_seo": "Simpsonville is a map-pack battleground: the town's growth means new competitors every month, but most are running weak profiles and generic sites. The businesses that fix their Google Business Profile, answer reviews, and publish local content are pulling away fast.",
        "foot_city": "Simpsonville, SC"
    },
    "greer": {
        "name": "Greer",
        "title_suffix": "Greer, SC",
        "desc_ai": "AI receptionist for Greer, SC businesses: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo — no contracts.",
        "desc_web": "Website design in Greer, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses. 30 days of support and edits included.",
        "desc_seo": "Local SEO in Greer, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo, updates from $49/mo.",
        "h1_ai": "AI Receptionist for Greer Small Businesses",
        "h1_web": "Website Design for Greer Small Businesses",
        "h1_seo": "Local SEO for Greer Businesses",
        "local_ai": "Greer sits at the center of the Upstate's manufacturing boom — BMW, Michelin, and a wave of new plants mean thousands of families have moved in over the last few years. That's a steady stream of new homeowners needing trades, and they all call the business that answers. Your AI receptionist picks up every time, even while you're on a job at the other end of town.",
        "local_web": "Greer's growth has brought a flood of new residents searching for local services — and most trade businesses are still running outdated sites. A fast, mobile-first site built for your services turns that search traffic into calls.",
        "local_seo": "With BMW and Michelin driving growth, Greer's service businesses compete for a bigger pool of customers every year. The winners are the ones who show up in the map pack and in AI recommendations — which is exactly what local SEO done right gets you.",
        "foot_city": "Greer, SC"
    },
    "mauldin": {
        "name": "Mauldin",
        "title_suffix": "Mauldin, SC",
        "desc_ai": "AI receptionist for Mauldin, SC businesses: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo — no contracts.",
        "desc_web": "Website design in Mauldin, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses. 30 days of support and edits included.",
        "desc_seo": "Local SEO in Mauldin, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo, updates from $49/mo.",
        "h1_ai": "AI Receptionist for Mauldin Small Businesses",
        "h1_web": "Website Design for Mauldin Small Businesses",
        "h1_seo": "Local SEO for Mauldin Businesses",
        "local_ai": "Mauldin sits right on Greenville's doorstep — a growing bedroom community where homeowners work in the city and come home to call local trades. That means steady demand, and it means every missed call is a job handed to a competitor. Your AI receptionist answers 24/7 and books the work while you're on the previous job.",
        "local_web": "Mauldin's location between Greenville and Simpsonville means your customers are searching for local services every day. A custom site built for your services and service area puts you in front of them — and keeps you ahead of the template-site competition.",
        "local_seo": "Mauldin businesses compete with both Greenville and Simpsonville shops for the same customers. The ones winning the map pack and AI recommendations are doing the fundamentals — profile, reviews, local content — consistently. That's what we set up for you.",
        "foot_city": "Mauldin, SC"
    },
    "easley": {
        "name": "Easley",
        "title_suffix": "Easley, SC",
        "desc_ai": "AI receptionist for Easley, SC businesses: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo — no contracts.",
        "desc_web": "Website design in Easley, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses. 30 days of support and edits included.",
        "desc_seo": "Local SEO in Easley, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo, updates from $49/mo.",
        "h1_ai": "AI Receptionist for Easley Small Businesses",
        "h1_web": "Website Design for Easley Small Businesses",
        "h1_seo": "Local SEO for Easley Businesses",
        "local_ai": "Easley anchors the west side of the Upstate — a town where families know their tradespeople by name and call the business that picks up. When you're on a job out toward Pickens County or Lake Keowee, your AI receptionist answers the next call, books it, and sends you the details. No missed work while you're on the road.",
        "local_web": "Easley's trade businesses serve a wide area — from town to the lake communities. A custom, mobile-first site built for your services makes sure the people searching for a plumber or landscaper in Easley find you first, not the chain that outspends you on ads.",
        "local_seo": "Easley is a word-of-mouth town, but the referrals now start with a search. The businesses winning the map pack in Easley are the ones with clean profiles, answered reviews, and local content. That's exactly what we build.",
        "foot_city": "Easley, SC"
    },
    "travelers-rest": {
        "name": "Travelers Rest",
        "title_suffix": "Travelers Rest, SC",
        "desc_ai": "AI receptionist for Travelers Rest, SC businesses: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo — no contracts.",
        "desc_web": "Website design in Travelers Rest, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses. 30 days of support and edits included.",
        "desc_seo": "Local SEO in Travelers Rest, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo, updates from $49/mo.",
        "h1_ai": "AI Receptionist for Travelers Rest Small Businesses",
        "h1_web": "Website Design for Travelers Rest Small Businesses",
        "h1_seo": "Local SEO for Travelers Rest Businesses",
        "local_ai": "Travelers Rest has gone from a quiet mill town to one of the fastest-growing spots in the Upstate — new homes, new neighborhoods, and a steady stream of people moving up from Greenville. Every one of them needs a trade, and they call the business that answers. Your AI receptionist picks up every time, even while you're on the North Greenville side of town.",
        "local_web": "TR is booming, and the businesses winning new customers are the ones with a professional web presence. A custom site built for your services — mobile-first, local SEO baked in — puts you ahead of the older template sites still running around town.",
        "local_seo": "Travelers Rest's growth means new competitors every quarter, but most are doing the same old thing: no review responses, thin profiles, generic sites. The fundamentals — done consistently — win the map pack here, and that's what we set up for you.",
        "foot_city": "Travelers Rest, SC"
    },
    "fountain-inn": {
        "name": "Fountain Inn",
        "title_suffix": "Fountain Inn, SC",
        "desc_ai": "AI receptionist for Fountain Inn, SC businesses: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo — no contracts.",
        "desc_web": "Website design in Fountain Inn, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses. 30 days of support and edits included.",
        "desc_seo": "Local SEO in Fountain Inn, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo, updates from $49/mo.",
        "h1_ai": "AI Receptionist for Fountain Inn Small Businesses",
        "h1_web": "Website Design for Fountain Inn Small Businesses",
        "h1_seo": "Local SEO for Fountain Inn Businesses",
        "local_ai": "Fountain Inn is growing fast — new construction along the 385 corridor means new homeowners every month, and they all need trades. When you're on a job in Simpsonville or Five Forks, your AI receptionist answers the calls you'd otherwise miss and books the appointments. Every call captured, every lead followed up.",
        "local_web": "Fountain Inn businesses serve a corridor that runs from Simpsonville to Mauldin — customers search before they call. A custom, mobile-first site built for your services makes sure they find you, not the bigger competitor down the highway.",
        "local_seo": "Fountain Inn's growth is pulling in new businesses, which means the map pack is getting more competitive. The winners are doing the fundamentals — profile, reviews, local content — consistently. That's the system we build for you.",
        "foot_city": "Fountain Inn, SC"
    },
    "five-forks": {
        "name": "Five Forks",
        "title_suffix": "Five Forks, SC",
        "desc_ai": "AI receptionist for Five Forks, SC businesses: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo — no contracts.",
        "desc_web": "Website design in Five Forks, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses. 30 days of support and edits included.",
        "desc_seo": "Local SEO in Five Forks, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo, updates from $49/mo.",
        "h1_ai": "AI Receptionist for Five Forks Small Businesses",
        "h1_web": "Website Design for Five Forks Small Businesses",
        "h1_seo": "Local SEO for Five Forks Businesses",
        "local_ai": "Five Forks is one of the most affluent corners of the Upstate — established neighborhoods, homeowners who invest in their properties, and steady demand for quality trades. When you're on a job, your AI receptionist answers the next call, books the appointment, and sends you the details. No missed work in the neighborhood with the deepest pockets.",
        "local_web": "Five Forks homeowners expect quality — and they check a website before they call. A custom, mobile-first site built for your services and this market puts you ahead of the template sites your competitors are running.",
        "local_seo": "Five Forks sits at the Simpsonville/Greenville border, so your customers compare you against shops in three cities. The businesses winning here do the fundamentals — clean profile, answered reviews, local content — consistently.",
        "foot_city": "Five Forks, SC"
    },
    "slater-marietta": {
        "name": "Slater-Marietta",
        "title_suffix": "Slater-Marietta, SC",
        "desc_ai": "AI receptionist for Slater-Marietta, SC businesses: answers every call 24/7, books appointments, captures leads. $100 setup + $19/mo — no contracts.",
        "desc_web": "Website design in Slater-Marietta, SC from $300 one-time. Custom, mobile-first sites for trades and local businesses. 30 days of support and edits included.",
        "desc_seo": "Local SEO in Slater-Marietta, SC: rank on Google and get cited by AI search. Full SEO-GEO-AEO audit $100, monitoring $39/mo, updates from $49/mo.",
        "h1_ai": "AI Receptionist for Slater-Marietta Small Businesses",
        "h1_web": "Website Design for Slater-Marietta Small Businesses",
        "h1_seo": "Local SEO for Slater-Marietta Businesses",
        "local_ai": "Slater-Marietta sits along the 25 corridor where the Upstate meets the mountains — a tight-knit area where homeowners call the business that answers. When you're on a job between Travelers Rest and Hendersonville, your AI receptionist answers the calls you'd otherwise miss and books the work. No job lost to voicemail.",
        "local_web": "Slater-Marietta businesses serve a spread-out area — from the town itself to the lake and mountain communities around it. A custom site built for your services and service area makes sure customers searching for a local trade find you first.",
        "local_seo": "In a small market like Slater-Marietta, a clean Google Business Profile and a real website put you ahead of almost everyone. Most local trades haven't touched their online presence in years — the ones who do win every new customer searching for help.",
        "foot_city": "Slater-Marietta, SC"
    }
}

SERVICE_TEMPLATES = {
    "ai-receptionist": {
        "file": "ai-receptionist-{city}-sc.html",
        "title": "AI Receptionist for Small Businesses in {city_name}, SC — Local Launch",
        "canon": "https://locallaunchupstate.com/services/ai-receptionist-{city}-sc.html",
        "crumb": "AI Receptionist {city_name} SC",
        "answer": "An AI receptionist in {city_name}, SC costs $100 to set up and $19/mo after that — it answers every call 24/7, books appointments, and sends you the details by text or email.",
        "section_h2": "What it does for your {city_name} business",
        "features": [
            ("Answers every call", "First ring. 24/7. Weekends, holidays, and the 3pm rush when you're up to your elbows in a job. No voicemail black holes."),
            ("Books appointments", "Trained on your services, hours, and service area — it schedules jobs directly into your calendar with the customer's details."),
            ("Captures lead info", "Name, address, what they need, when they need it. Every call summarized and sent to your phone by text or email."),
            ("Works with your site", "Add it to your Local Launch website or your existing site. Phone and web chat, one system."),
        ],
        "price_h3": "{city_name} pricing",
        "price_line": "$100 setup · $19/mo",
        "price_body": "One-time setup to train it on your business, then a flat $19/mo. No long-term contract — month to month, cancel anytime. Most agencies in the Carolinas charge $99–$297/mo for the same thing. You're paying less than a missed call costs you in a week.",
        "cta": "Get Your AI Receptionist",
        "kicker": "{city_name}, SC",
        "service_type": "AI Receptionist",
        "service_name": "AI Receptionist for Small Businesses in {city_name}, SC",
        "offer_name": "AI Receptionist Setup",
    },
    "web-design": {
        "file": "web-design-{city}-sc.html",
        "title": "Website Design for Small Businesses in {city_name}, SC — Local Launch",
        "canon": "https://locallaunchupstate.com/services/web-design-{city}-sc.html",
        "crumb": "Website Design {city_name} SC",
        "answer": "A professional website for a {city_name}, SC small business costs $300 — one-time, with 30 days of support and edits included.",
        "section_h2": "What you get for $300",
        "features": [
            ("Custom design", "Built around your services, your city, and your customers — not a template everyone else already has."),
            ("Mobile-first", "Most of your customers will find you on a phone. Your site is built and tested for mobile first."),
            ("Local SEO baked in", "Structured for {city_name} and Upstate searches from day one — service pages, schema, and local signals included."),
            ("30 days of support", "Edits, tweaks, changes — included for the first 30 days. Nothing's finished until you're happy."),
        ],
        "price_h3": "{city_name} pricing",
        "price_line": "$300 one-time · $49/mo care",
        "price_body": "One-time build with 30 days of edits. Want ongoing changes, SEO/GEO updates, and monthly optimization? Add Website Care for $49/mo — month to month, no contract. The big agencies around the Upstate charge $1,500–$8,000 for what you get here for $300.",
        "cta": "Start Your Build",
        "kicker": "{city_name}, SC",
        "service_type": "Web Design",
        "service_name": "Website Design for Small Businesses in {city_name}, SC",
        "offer_name": "Website Build",
    },
    "seo": {
        "file": "seo-{city}-sc.html",
        "title": "Local SEO for {city_name}, SC Businesses — Google + AI Search | Local Launch",
        "canon": "https://locallaunchupstate.com/services/seo-{city}-sc.html",
        "crumb": "Local SEO {city_name} SC",
        "answer": "Local SEO in {city_name}, SC starts with a $100 full audit — covering Google, AI search, and answer engines — then $39/mo for monitoring and $49/mo for ongoing updates.",
        "section_h2": "What your {city_name} SEO includes",
        "features": [
            ("Google Business Profile", "Categories, services, service areas, Google Posts — the fixes that move the map pack more than anything else."),
            ("Review system", "Generate reviews, respond to every one, and turn your Google rating into a ranking asset."),
            ("GEO / AI search visibility", "Front-loaded answers, FAQ schema, and local content that make you citable by ChatGPT and Perplexity."),
            ("Monthly tracking", "Rankings, reviews, and AI-visibility — plain-language reports on what moved and what's next."),
        ],
        "price_h3": "{city_name} pricing",
        "price_line": "$100 audit · $39/mo monitoring · $49/mo updates",
        "price_body": "Start with the audit to see exactly where you stand on Google and in AI search. Then pick monitoring ($39/mo), ongoing updates ($49/mo), or both. Month to month, cancel anytime — no $1,000/mo retainers, no 6-month contracts.",
        "cta": "Get Your Audit",
        "kicker": "{city_name}, SC",
        "service_type": "Local SEO & GEO",
        "service_name": "Local SEO for {city_name}, SC Businesses",
        "offer_name": "SEO GEO AEO Audit",
    },
}

NAV_LINKS = """
    <a href="tel:+15033585860" style="color:var(--ink);font-weight:600">503-358-5860</a>
    <a href="/services/web-design.html">Web Design</a>
    <a href="/services/seo.html">SEO</a>
    <a href="/#pricing">Pricing</a>
    <a href="/score.html" class="nav-cta">See Your SEO Score</a>"""


def build_page(city_key, city, service_key, svc):
    fname = svc["file"].format(city=city_key)
    path = os.path.join(BASE, fname)

    features = "\n".join(
        f'      <div class="feature-card"><h3>{h}</h3><p>{p}</p></div>' for h, p in svc["features"]
    )

    local_para = {
        "ai-receptionist": city["local_ai"],
        "web-design": city["local_web"],
        "seo": city["local_seo"],
    }[service_key]

    h1_key = {"ai-receptionist": "h1_ai", "web-design": "h1_web", "seo": "h1_seo"}[service_key]

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{svc['title'].format(city_name=city['name'])}</title>
<meta name="description" content="{city['desc_' + ('ai' if service_key=='ai-receptionist' else 'web' if service_key=='web-design' else 'seo')]}">
<meta name="theme-color" content="#1B1A18">
<link rel="canonical" href="{svc['canon'].format(city=city_key)}">
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@graph": [
    {{
      "@type": "Service",
      "@id": "{svc['canon'].format(city=city_key)}#service",
      "name": "{svc['service_name'].format(city_name=city['name'])}",
      "serviceType": "{svc['service_type']}",
      "description": "{(svc['answer'].split('—')[0]).strip()}",
      "provider": {{
        "@type": "LocalBusiness",
        "@id": "https://locallaunchupstate.com/#business",
        "name": "Local Launch",
        "url": "https://locallaunchupstate.com",
        "telephone": "+1-503-358-5860",
        "address": {{"@type": "PostalAddress", "addressLocality": "{city['name']}", "addressRegion": "SC", "addressCountry": "US"}}
      }},
      "areaServed": {{"@type": "City", "name": "{city['name']}, SC"}},
      "url": "{svc['canon'].format(city=city_key)}",
      "offers": {{"@type": "Offer", "name": "{svc['offer_name']}", "price": "100", "priceCurrency": "USD", "description": "{svc['offer_name']} for {city['name']}, SC."}}
    }},
    {{
      "@type": "BreadcrumbList",
      "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://locallaunchupstate.com/"}},
        {{"@type": "ListItem", "position": 2, "name": "{svc['crumb'].format(city_name=city['name'])}", "item": "{svc['canon'].format(city=city_key)}"}}
      ]
    }}
  ]
}}
</script>
<style>
  :root{{--bg:#1B1A18;--bg2:#211F1C;--panel:#26231F;--ink:#F2EFE9;--muted:#A6A093;--accent:#2AA8A8;--accent-soft:rgba(42,168,168,.14);--green:#6FD0CC;--line:rgba(242,239,233,.09);--radius:18px}}
  *{{margin:0;padding:0;box-sizing:border-box}}
  html{{scroll-behavior:smooth}}
  body{{background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.6;overflow-x:hidden;position:relative}}
  body::before{{content:"";position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 50% 50% at 25% 20%,rgba(42,168,168,.08) 0%,transparent 60%),radial-gradient(ellipse 40% 40% at 75% 60%,rgba(42,168,168,.06) 0%,transparent 60%),radial-gradient(ellipse 35% 35% at 50% 85%,rgba(111,208,204,.05) 0%,transparent 55%)}}
  ::selection{{background:var(--accent);color:#1B1A18}}
  nav{{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:12px clamp(20px,5vw,56px);background:rgba(27,26,24,.85);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}}
  .logo a{{color:var(--ink);text-decoration:none;font-weight:800;letter-spacing:-.02em;font-size:1.08rem}}
  .logo span{{color:var(--accent)}}
  .nav-links{{display:flex;gap:22px;align-items:center}}
  .nav-links a{{color:var(--muted);text-decoration:none;font-size:.84rem;font-weight:500;transition:color .25s}}
  .nav-links a:hover{{color:var(--ink)}}
  .nav-cta{{background:var(--accent);color:#1B1A18!important;font-weight:700;padding:8px 16px;border-radius:99px;font-size:.82rem!important}}
  @media(max-width:720px){{.nav-links a:not(.nav-cta){{display:none}}}}
  .page-hero{{position:relative;z-index:1;padding:140px clamp(20px,6vw,72px) 60px;max-width:900px;margin:0 auto}}
  .page-hero .kicker{{display:inline-flex;align-items:center;gap:10px;font-size:.8rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;padding:8px 16px;border:1px solid rgba(42,168,168,.3);border-radius:99px;background:var(--accent-soft)}}
  .page-hero h1{{font-size:clamp(2rem,5vw,3.4rem);line-height:1.08;letter-spacing:-.03em;font-weight:800;margin-bottom:20px}}
  .page-hero .answer{{color:var(--ink);font-size:1.1rem;max-width:700px;line-height:1.7;font-weight:500}}
  .page-hero .subtitle{{color:var(--muted);font-size:1.05rem;max-width:680px;line-height:1.7;margin-top:16px}}
  section{{position:relative;z-index:1;padding:clamp(40px,8vw,80px) clamp(20px,6vw,72px)}}
  .wrap{{max-width:900px;margin:0 auto}}
  h2{{font-size:clamp(1.5rem,2.8vw,2.1rem);letter-spacing:-.02em;line-height:1.15;font-weight:800;margin-bottom:28px}}
  .features{{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:26px}}
  @media(max-width:700px){{.features{{grid-template-columns:1fr}}}}
  .feature-card{{background:var(--bg2);border:1px solid var(--line);border-radius:var(--radius);padding:26px 24px;overflow:hidden}}
  .feature-card h3{{font-size:1.05rem;font-weight:700;margin-bottom:10px}}
  .feature-card p{{color:var(--muted);font-size:.94rem;line-height:1.65}}
  .pricing-box{{background:linear-gradient(165deg,#17302D,var(--bg2));border:1px solid rgba(42,168,168,.25);border-radius:var(--radius);padding:clamp(28px,4vw,40px);margin-top:30px}}
  .pricing-box h3{{color:var(--accent);font-size:1.1rem;font-weight:700;margin-bottom:10px}}
  .pricing-box p{{color:var(--muted);font-size:1rem;line-height:1.7}}
  .pricing-box .price-line{{color:var(--ink);font-size:1.5rem;font-weight:800;margin:14px 0 6px}}
  .btn{{display:inline-flex;align-items:center;gap:9px;padding:15px 28px;border-radius:99px;font-weight:700;font-size:.98rem;text-decoration:none;transition:transform .25s,box-shadow .25s;cursor:pointer;border:none;margin-top:24px}}
  .btn-primary{{background:var(--accent);color:#1B1A18}}
  .btn-primary:hover{{transform:translateY(-3px);box-shadow:0 10px 32px rgba(42,168,168,.4)}}
  footer{{position:relative;z-index:1;border-top:1px solid var(--line);padding:34px clamp(20px,6vw,72px);display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;color:var(--muted);font-size:.88rem}}
  footer a{{color:var(--accent);text-decoration:none}}
</style>
</head>
<body>
<nav>
  <div class="logo"><a href="/">Local<span>Launch</span></a></div>
  <div class="nav-links">{NAV_LINKS}
  </div>
</nav>

<header class="page-hero">
  <div class="kicker">{svc['kicker'].format(city_name=city['name'])}</div>
  <h1>{city[h1_key]}</h1>
  <p class="answer"><strong>{svc['answer'].format(city_name=city['name'])}</strong></p>
  <p class="subtitle">{local_para}</p>
  <a href="/#contact" class="btn btn-primary">{svc['cta']} →</a>
</header>

<section>
  <div class="wrap">
    <h2>{svc['section_h2'].format(city_name=city['name'])}</h2>
    <div class="features">
{features}
    </div>

    <div class="pricing-box">
      <h3>{svc['price_h3'].format(city_name=city['name'])}</h3>
      <div class="price-line">{svc['price_line']}</div>
      <p>{svc['price_body'].format(city_name=city['name'])}</p>
      <a href="/#contact" class="btn btn-primary">{svc['cta']} →</a>
    </div>
  </div>
</section>

<footer>
  <span>© 2026 Local Launch — {city['foot_city']}</span>
  <span><a href="/">Home</a> · <a href="/score.html">SEO Score</a> · <a href="tel:+15033585860">503-358-5860</a></span>
</footer>
</body>
</html>
"""
    open(path, "w").write(html)
    print(f"  ✓ {fname}")


def main():
    total = 0
    for city_key, city in CITIES.items():
        for service_key, svc in SERVICE_TEMPLATES.items():
            build_page(city_key, city, service_key, svc)
            total += 1
    print(f"\n{total} pages generated")


if __name__ == "__main__":
    main()
