#!/usr/bin/env python3
"""Vision QA: run Gemini band analysis on all 18 demos (desktop + mobile), report only defects."""
import subprocess, os, sys

QA = '/mnt/d/Hermes/hermes-home/profiles/local-launch-supervisor/skills/web-design/website-vision-qa/scripts/gemini_band_qa.py'
VENV = '/home/zach/.hermes/hermes-agent/venv/bin/python3'
slugs = ['lumberjack','tree-wisemen','gotta-guy','mmk','sky-branch','gulottas','brb','home-shield',
         'upstate-window','fix-home','brian-dillard','milford','sbc','kanebreak','wright-time',
         'all-in-one','fresh-blades','fresh-start']
BANDS = 4

def qa(path, width):
    r = subprocess.run([VENV, QA, path, str(BANDS), str(width)],
                       capture_output=True, text=True, timeout=900)
    # parse bands
    defects = []
    for b in r.stdout.split('--- band')[1:]:
        lines = [l.strip() for l in b.split('\n') if l.strip()]
        if len(lines) >= 2:
            resp = ' '.join(lines[1:])
            if resp and 'CLEAN' not in resp.upper() and not resp.startswith('ERR'):
                defects.append(resp[:220])
    return defects

for slug in slugs:
    issues = []
    d = qa(f'/mnt/d/LocalLaunch/qa/{slug}/desk_full.png', 1280)
    m = qa(f'/mnt/d/LocalLaunch/qa/{slug}/mob_full.png', 390)
    if d: issues += [f"DESKTOP: {x}" for x in d]
    if m: issues += [f"MOBILE: {x}" for x in m]
    if issues:
        print(f"\n===== {slug} =====")
        for x in issues:
            print(f"  • {x}")
    else:
        print(f"✓ {slug}: CLEAN")
print("\n===== VISION QA DONE =====")
