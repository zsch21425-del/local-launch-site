#!/usr/bin/env python3
"""Verify all 18 demo builds: leak check, tel E.164, placeholders, fabricated email."""
import re, os

BW = '/mnt/d/LocalLaunch/builder-work'

# slug -> old-template-client terms that must be ABSENT (empty = it IS the template's source client)
LEAK = {
 'lumberjack-tree-service': [],
 'tree-wisemen-upstate': ['Lumberjack','McCollum','642-7705'],
 'gotta-guy-home-services': ['Joshua','Truitt','601-0891'],
 'fix-home-projects': ['Joshua','Truitt','601-0891','Fountain Inn'],
 'sbc-handyman-services': ['Joshua','Truitt','601-0891','Fountain Inn'],
 'kanebreak-custom-backyards': ['Joshua','Truitt','601-0891','Fountain Inn'],
 'mmk-pressure-washing': ['Elite Sweep','Kettering','Dayton','776-4600'],
 'brb-pressure-washing': ['Elite Sweep','Kettering','Dayton','776-4600'],
 'gulottas-window-cleaning': ['Elite Sweep','Kettering','Dayton','776-4600'],
 'upstate-window-cleaning': ['Elite Sweep','Kettering','Dayton','776-4600'],
 'fresh-start-pressure-washing': ['Elite Sweep','Kettering','Dayton','776-4600'],
 'sky-branch-llc': ['Carolina Gutter','555-0142'],
 'home-shield-roofing': [],
 'brian-dillard-concrete': ['Gray Wolf','906-1914'],
 'milford-mountain-landscape': ['L And P','LandP','612-3912'],
 'fresh-blades-lawn-care': ['L And P','LandP','612-3912'],
 'wright-time-disposal': [],
 'all-in-one-maintenance': [],
}
# fabricated email pattern (contact@<slug>.com) that should be LL email
FAB_EMAIL = re.compile(r'contact@[a-z0-9-]+\.(?:com|net|org)', re.I)

report = []
for slug, terms in LEAK.items():
    p = f'{BW}/{slug}/index.html'
    if not os.path.exists(p):
        report.append((slug, 'MISSING', '')); continue
    txt = open(p, encoding='utf-8', errors='ignore').read()
    issues = []
    for t in terms:
        if txt.count(t): issues.append(f"LEAK:{t}")
    # placeholders (real {{TOKEN}}, not JS)
    ph = re.findall(r'\{\{[A-Z_]+\}\}', txt)
    if ph: issues.append(f"PH:{len(ph)}")
    # tel check
    tels = re.findall(r'tel:(\+\d+)', txt)
    bad = [t for t in tels if not re.fullmatch(r'\+\d{10,11}', t)]
    if bad: issues.append(f"TEL:{bad}")
    if not tels: issues.append("NO-TEL")
    # fabricated email
    for e in set(FAB_EMAIL.findall(txt)):
        issues.append(f"EMAIL:{e}")
    report.append((slug, 'OK' if not issues else '; '.join(issues), f"tel={len(tels)}"))

for slug, status, extra in report:
    print(f"{'✓' if status=='OK' else '✗'} {slug}: {status} {extra}")
