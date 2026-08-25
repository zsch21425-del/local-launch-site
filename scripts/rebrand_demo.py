#!/usr/bin/env python3
"""Fork a vertical template and rebrand for a prospect. Hallmark-safe: 0 raw hex (template already compliant),
overflow-x:clip (template already), honest placeholder reviews. Local-only, no deploy."""
import json, os, re, sys

TEMPLATES="/mnt/d/LocalLaunch/templates"
DEMOS="/mnt/d/LocalLaunch/demos"

# Generic honest review placeholder (replaces any template's demo quote)
REVIEW_QUOTE="— Real review coming soon —"
REVIEW_ATTR="Verified Google review"

def rebrand(cid, name, loc, phone, tel, vert, area_metro):
    src=os.path.join(TEMPLATES,vert)
    dst=os.path.join(DEMOS,cid)
    if not os.path.isdir(src):
        return f"MISSING template {vert}"
    os.makedirs(dst,exist_ok=True)
    # copy entire template (including api/, videos, images)
    os.system(f'cp -r "{src}"/. "{dst}"/')
    idx=os.path.join(dst,"index.html")
    html=open(idx,encoding='utf-8').read()

    # Detect template's business name(s) to replace: look for a brand in nav/title
    # Strategy: replace known generic template tokens if present, else do broad swaps.
    # We'll swap: any occurrence of the template's demo business name is hard to know generically,
    # so we do targeted field swaps on common patterns + a generic scrape of title brand.

    # 1. Title + meta description brand
    m=re.search(r'<title>([^<]+)</title>',html)
    if m:
        old_brand=m.group(1).split(' — ')[0].split(' | ')[0].strip()
        html=html.replace(old_brand,name)

    # 2. phone (find tel: and display)
    # replace all tel:+1XXXXXXXXXX and display phone patterns
    html=re.sub(r'tel:\+1\d{10}', f'tel:{tel}', html)
    # display phones like (937) 776-4600 or 937-776-4600 -> new phone
    html=re.sub(r'\(\d{3}\)\s*\d{3}-\d{4}', phone, html)
    html=re.sub(r'\d{3}-\d{3}-\d{4}(?!<\d)', phone, html)

    # 3. location / metro
    # Replace common OH/Dayton/Kettering/Charleston/Easley area strings with new loc
    for old in ['Kettering, OH','Dayton metro','Dayton Metro','Charleston, SC','Easley, SC','Anderson, SC','Greenville, SC','Spartanburg, SC']:
        if old.lower() in html.lower():
            html=re.sub(re.escape(old), area_metro, html, flags=re.IGNORECASE)

    # 4. reviews -> honest placeholders (replace any blockquote quote text + cite)
    # Replace quoted testimonial text
    html=re.sub(r'class="testi-quote"[^>]*>.*?</p>', f'class="testi-quote">\n      {REVIEW_QUOTE}\n    </p>', html, flags=re.DOTALL)
    html=re.sub(r'class="testi-attr[^"]*"[^>]*>.*?</cite>', f'class="testi-attr">\n        {REVIEW_ATTR}\n      </cite>', html, flags=re.DOTALL)

    # 5. women-owned -> locally owned where present
    html=html.replace('Women-Owned','Locally Owned').replace('women-owned','locally owned')

    # assert + write
    assert len(html)>5000, f"shrank {len(html)}"
    open(idx,'w',encoding='utf-8').write(html)
    # verify Hallmark
    hexes=re.findall(r'#[0-9a-fA-F]{6}',html)
    clip=html.count('overflow-x:clip'); hidden=html.count('overflow-x:hidden')
    return f"OK brand={name} hex={len(hexes)} clip={clip} hidden={hidden}"

if __name__=="__main__":
    details=json.load(open('/tmp/build_details.json'))
    batch=int(sys.argv[1]) if len(sys.argv)>1 else 5
    for o in details[:batch]:
        # area_metro = city + SC / metro
        city=re.sub(r',.*','',o['loc']).strip()
        metro=f"{city}, SC"
        r=rebrand(o['id'],o['name'],o['loc'],o['phone'],o['tel'],o['vert'],metro)
        print(f"  {o['id']:32s} -> {r}")
