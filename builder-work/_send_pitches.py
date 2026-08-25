#!/usr/bin/env python3
"""Send 19 approved pitch emails via himalaya -a locallaunch."""
import subprocess, re, glob, os, time

OUT = '/mnt/d/LocalLaunch/emails/2026-08-23'
HIMALAYA = '/home/zach/.local/bin/himalaya'
files = sorted(f for f in glob.glob(f'{OUT}/*.md') if not f.endswith('00-MANIFEST.md'))
files = [f for f in files if 'greenville-pro-painters' not in f]  # no email

sent, failed, skipped = [], [], []
for f in files:
    t = open(f, encoding='utf-8').read()
    subj = re.search(r'^Subject: (.*)$', t, re.M).group(1)
    to = re.search(r'^To: (.*)$', t, re.M).group(1)
    tag = os.path.basename(f).replace('.md','')
    if 'NO EMAIL' in to:
        skipped.append(tag); continue
    body = t.split('\n\n', 1)[1]
    open('/tmp/pitch-email.txt', 'w', encoding='utf-8').write(body)
    cmd = (f"cat /tmp/pitch-email.txt | {HIMALAYA} template write -a locallaunch "
           f"-H 'To:{to}' -H 'Subject:{subj}' "
           f"-H 'From:Local Launch Upstate <locallaunchupstate@gmail.com>' "
           f"| {HIMALAYA} template send -a locallaunch")
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=90)
    ok = 'successfully sent' in (r.stdout + r.stderr).lower()
    print(f"{tag:22s} {to:32s} -> {'SENT' if ok else 'FAIL'}", flush=True)
    if ok:
        sent.append((tag, to))
    else:
        failed.append((tag, to, r.stdout[-180:], r.stderr[-180:]))
    time.sleep(1)

print(f"\n=== SENT {len(sent)} | FAILED {len(failed)} | SKIPPED {len(skipped)} ===")
for tag, to, out, err in failed:
    print(f"FAIL {tag} {to}\n  out: {out}\n  err: {err}")
