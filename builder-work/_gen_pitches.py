#!/usr/bin/env python3
"""Generate 20 pitch emails (Tier A no-site) — locked voice, $300 pricing, embedded demo."""
import os, json, subprocess, re

DATE = '2026-08-23'
OUT = f'/mnt/d/LocalLaunch/emails/{DATE}'
os.makedirs(OUT, exist_ok=True)

# name, slug, email, city, trade, hook_detail (verified "active on X" fact), demo_url
LEADS = [
 ("All In One Maintenance","all-in-one","jleebrown051190@gmail.com","Pelzer","junk removal, lawn care and handyman work","you're active in local Facebook groups","https://all-in-one-maintenance-demo.vercel.app"),
 ("BRB Pressure Washing Service","brb","hbelin@bellsouth.net","Greenville","pressure washing","you're listed on Nextdoor","https://brb-pressure-washing-demo.vercel.app"),
 ("Brian Dillard Concrete LLC","brian-dillard","dillard4827@gmail.com","Roebuck","concrete work","you're on Nextdoor","https://brian-dillard-concrete-demo.vercel.app"),
 ("FIX Home Projects LLC","fix-home","fixhomeprojects@gmail.com","Greenville","handyman and deck work","you're active on Facebook and Nextdoor","https://fix-home-projects-demo.vercel.app"),
 ("Fresh Blades Lawn Care","fresh-blades","freshbladeslawn1@gmail.com","Lyman","lawn care","you're listed on Yelp and Nextdoor","https://fresh-blades-lawn-care-demo.vercel.app"),
 ("Fresh Start Pressure Washing","fresh-start","Scott.freshstartclean@gmail.com","Clemson","pressure washing","you're active on Nextdoor","https://fresh-start-pressure-washing-demo.vercel.app"),
 ("Gotta Guy Home Services","gotta-guy","gottaguy5@gmail.com","Simpsonville","handyman work","you're on Facebook, Nextdoor and Houzz","https://gotta-guy-home-services-demo.vercel.app"),
 ("Gulotta's Window Cleaning","gulottas","jeffgulotta@att.net","Greenville","window cleaning","neighbors recommend you on Nextdoor","https://gulottas-window-cleaning-demo.vercel.app"),
 ("Home Shield Roofing","home-shield","homeshieldroofing@yahoo.com","Anderson","roofing","your listed website is down","https://home-shield-roofing-demo.vercel.app"),
 ("Kanebreak Custom Backyards","kanebreak","kanebreakbackyards@gmail.com","Greenville","decks and fencing","you're on Nextdoor and Facebook","https://kanebreak-custom-backyards-demo.vercel.app"),
 ("Lumberjack Tree Service","lumberjack","Ljtreeserviceasc@gmail.com","Anderson","tree service","you're established in Anderson","https://lumberjack-treeservice-demo.vercel.app"),
 ("MM&K Pressure Washing","mmk","Smpurgason@gmail.com","Anderson","pressure washing","you're on Nextdoor","https://mmk-pressure-washing-demo.vercel.app"),
 ("Milford Mountain Landscape","milford","milfordmountain@gmail.com","Greer","landscaping","you're on Nextdoor","https://milford-mountain-landscape-demo.vercel.app"),
 ("SBC Handyman Services","sbc","ronniefoshee@gmail.com","Greenville","handyman work","you're on Nextdoor","https://sbc-handyman-services-demo.vercel.app"),
 ("Sky Branch LLC","sky-branch","skybranchllc@gmail.com","Greer","gutter and window work","you do great work across the Upstate","https://sky-branch-llc-demo.vercel.app"),
 ("Tree Wisemen Upstate","tree-wisemen","Treewisemenupstate@gmail.com","Easley","tree service","you're active in the Easley area","https://tree-wisemen-upstate-demo.vercel.app"),
 ("Upstate Window Cleaning LLC","upstate-window","uscwindowcleaning@gmail.com","Inman","window cleaning","people recommend you in local groups","https://upstate-window-cleaning-demo.vercel.app"),
 ("Wright Time Disposal Service","wright-time","Wrightjcw1@gmail.com","Pelzer","junk removal","you're on Facebook and Nextdoor","https://wright-time-disposal-demo.vercel.app"),
 ("Cleaning Angels","cleaning-angels","Ericagraysonwilson@icloud.com","Fountain Inn","house cleaning","you're on Yelp and Nextdoor","https://cleaning-angels-demo.vercel.app"),
 ("Greenville Pro Painters","greenville-pro-painters",None,"Greenville","painting","you're active across Greenville","https://greenville-pro-painters-demo.vercel.app"),
]

def subject(trade, city):
    return f"{trade} in {city}".lower()

def body(name, trade, city, hook, demo):
    return (
f"Hello, this is Zach from Local Launch.\n\n"
f"I was looking up {trade} in {city} and couldn't find a website for {name} — even though {hook}.\n\n"
f"When someone searches for {trade} in {city}, they're finding competitors instead of you. "
f"I build sites that fix that:\n{demo}\n\n"
f"$300 one-time covers the site, SEO, and Google setup. Monthly plans start at $49 — or just the one-time fix-up, no monthly anything.\n\n"
f"I look forward to hearing from you.\n\n"
f"Zach\nLocal Launch | Simpsonville, SC\n(503) 358-5860\n"
    )

# email MX check (verify-before-send)
def mx_ok(email):
    if not email: return False
    dom = email.split('@')[-1]
    try:
        r = subprocess.run(['dig','+short','MX',dom], capture_output=True, text=True, timeout=10)
        return bool(r.stdout.strip())
    except Exception:
        return None

manifest = []
for i, (name, slug, email, city, trade, hook, demo) in enumerate(LEADS, 1):
    subj = subject(trade, city)
    b = body(name, trade, city, hook, demo)
    fn = f"{i:02d}-{slug}.md"
    with open(f'{OUT}/{fn}', 'w') as f:
        f.write(f"Subject: {subj}\nTo: {email or '(NO EMAIL)'}\n\n{b}")
    mx = mx_ok(email) if email else None
    manifest.append((name, email, city, trade, demo, mx))
    print(f"[{i:02d}] {name:28s} | {email or 'NO EMAIL':32s} | MX={mx}")

# write manifest
with open(f'{OUT}/00-MANIFEST.md','w') as f:
    f.write(f"# Pitch Batch {DATE} — {len(LEADS)} drafts\n\n")
    f.write("| # | Business | Email | City | Trade | Demo | MX |\n|---|---|---|---|---|---|---|\n")
    for i,(name,email,city,trade,demo,mx) in enumerate(manifest,1):
        f.write(f"| {i} | {name} | {email or '⚠️ NONE'} | {city} | {trade} | [demo]({demo}) | {'✅' if mx else '⚠️ fail'} |\n")
    f.write("\n## Blocked\n- Greenville Pro Painters: NO EMAIL on file (need enrichment before send)\n")

print(f"\nWrote {len(LEADS)} drafts + manifest to {OUT}")
