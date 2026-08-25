#!/usr/bin/env python3
"""Trim both window demos to verified service (window cleaning only). Remove gutter/pressure/screen."""
import json, urllib.request, re, os

TOK = json.load(open('/home/zach/.hermes/profiles/revenue-gen/auth.json'))['providers']['xai-oauth']['tokens']['access_token']
B = '/mnt/d/LocalLaunch/builder-work'
SLUGS = ['gulottas-window-cleaning', 'upstate-window-cleaning']

def gen(prompt):
    body = json.dumps({"model":"grok-imagine-image","prompt":prompt,"n":1,"response_format":"url"})
    req = urllib.request.Request("https://api.x.ai/v1/images/generations", data=body.encode(),
        headers={"Authorization":"Bearer "+TOK,"Content-Type":"application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=90).read())['data'][0]['url']

def save(url, dest):
    data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"}), timeout=60).read()
    open(dest, 'wb').write(data)
    return len(data)//1024

# 1. generate 2 window-only gallery images (interior + exterior) -> svc-interior.jpg, svc-exterior.jpg
INTERIOR = ("A clean interior residential window with crystal-clear glass, bright natural daylight streaming through, "
            "white wooden frame and sill, documentary style, no people no text, 16:9 widescreen")
EXTERIOR = ("An exterior residential window washed to a sparkling streak-free shine, the glass reflecting a bright blue "
            "sky, clean white trim, documentary style, no people no text, 16:9 widescreen")

for slug in SLUGS:
    for name, prompt in [('svc-interior.jpg', INTERIOR), ('svc-exterior.jpg', EXTERIOR)]:
        dest = f'{B}/{slug}/{name}'
        try:
            url = gen(prompt)
            kb = save(url, dest)
            print(f"✓ {slug}/{name} ({kb}KB)")
        except Exception as e:
            print(f"✗ {slug}/{name}: {e}")

# 2. HTML edits
CARD_FIXES = [
    ('Pressure Washing', 'Interior Windows', 'Inside glass, frames, and sills cleaned to a streak-free shine — no drips, no streaks.'),
    ('Gutter Cleaning', 'Exterior Windows', 'Outside panes and frames washed clean to restore the view and boost curb appeal.'),
    ('Screen Cleaning', 'Commercial Windows', 'Storefronts, offices, and retail spaces kept sparkling for your customers.'),
    ('Screen Repair', 'Commercial Windows', 'Storefronts, offices, and retail spaces kept sparkling for your customers.'),
]

for slug in SLUGS:
    p = f'{B}/{slug}/index.html'
    txt = open(p, encoding='utf-8').read()

    # --- service cards: title + desc ---
    for old_title, new_title, new_desc in CARD_FIXES:
        old_tag = f'>{old_title}</h3>'
        if old_tag in txt:
            txt = txt.replace(old_tag, f'>{new_title}</h3>')
            # replace the desc that follows this title
            txt = re.sub(
                r'(<h3 class="service-card__title">' + re.escape(new_title) + r'</h3>\s*<p class="service-card__desc">).*?(</p>)',
                r'\1' + new_desc + r'\2', txt, flags=re.S)

    # --- gallery: gutter/screen -> interior/exterior window ---
    txt = txt.replace('src="svc-siding.jpg"', 'src="svc-interior.jpg"')
    txt = txt.replace('src="svc-patio.jpg"', 'src="svc-exterior.jpg"')
    txt = txt.replace('alt="Gutter cleaning service"', 'alt="Interior window cleaning"')
    txt = txt.replace('alt="Window screen cleaning"', 'alt="Exterior window cleaning"')
    txt = txt.replace('<figcaption class="gallery__cap">Gutter Cleaning</figcaption>', '<figcaption class="gallery__cap">Interior Windows</figcaption>')
    txt = txt.replace('<figcaption class="gallery__cap">Screen Cleaning</figcaption>', '<figcaption class="gallery__cap">Exterior Windows</figcaption>')

    # --- meta + copy: strip unverified services ---
    if slug == 'gulottas-window-cleaning':
        txt = txt.replace("Greenville's trusted window cleaning, pressure washing, gutter cleaning &amp; screen cleaning. Free estimates.",
                          "Greenville's trusted professional window cleaning for homes and businesses. Free estimates.")
    else:
        txt = txt.replace("professional window cleaning, gutter cleaning, and screen repair in Inman, SC. Free estimates.",
                          "professional window cleaning for homes and businesses in Inman, SC. Free estimates.")
    txt = txt.replace("Comprehensive window cleaning and exterior services for residential and commercial properties",
                      "Professional window cleaning for homes and businesses")
    txt = txt.replace("Professional window cleaning and exterior services completed for Greenville homes and businesses.",
                      "Professional window cleaning completed for Greenville homes and businesses.")
    txt = txt.replace("professional window cleaning, pressure washing, gutter cleaning, and screen cleaning",
                      "professional window cleaning")

    open(p, 'w', encoding='utf-8').write(txt)
    print(f"\n{slug}: edited")

# 3. delete old gutter/screen images
for slug in SLUGS:
    for f in ['svc-siding.jpg', 'svc-patio.jpg']:
        fp = f'{B}/{slug}/{f}'
        if os.path.exists(fp):
            os.remove(fp); print(f"removed {slug}/{f}")

# 4. verify leftover off-trade claims
print("\n=== leftover check ===")
for slug in SLUGS:
    txt = open(f'{B}/{slug}/index.html', encoding='utf-8').read()
    left = {kw: len(re.findall(kw, txt, re.I)) for kw in ['gutter','pressure','screen repair','screen clean','siding','patio']}
    print(f"{slug}: {left}")
    # show service card titles + gallery captions
    titles = re.findall(r'<h3 class="service-card__title">(.*?)</h3>', txt)
    caps = re.findall(r'<figcaption class="gallery__cap">(.*?)</figcaption>', txt)
    print(f"  services: {titles}")
    print(f"  gallery: {caps}")
