#!/usr/bin/env python3
"""Per-image on-trade check across all 18 demos. Reports OFF-TRADE/AI-slop images."""
import re, os, base64, json, urllib.request, time

def load_key():
    for line in open('/home/zach/.hermes/.env'):
        if line.strip().startswith('GEMINI_API_KEY='):
            return line.strip().split('=',1)[1].strip()
KEY = load_key()

def vision(path, caption):
    b64 = base64.b64encode(open(path,'rb').read()).decode()
    q = (f"One sentence: does this image look like a realistic professional photo of "
         f"'{caption}' (ON-TRADE), or off-trade/AI-slop (wrong subject, warped hands/faces, "
         f"gibberish text, fake plastic look)? Reply 'ON-TRADE' or 'OFF-TRADE' then a short reason.")
    body = {"contents":[{"parts":[{"inlineData":{"mimeType":"image/jpeg","data":b64}},{"text":q}]}],
            "generationConfig":{"maxOutputTokens":4096}}
    req = urllib.request.Request('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        data=json.dumps(body).encode(), headers={'X-goog-api-key':KEY,'Content-Type':'application/json'})
    r = json.loads(urllib.request.urlopen(req, timeout=120).read())
    return r['candidates'][0]['content']['parts'][0]['text'].strip()

BUILD = '/mnt/d/LocalLaunch/builder-work'
SKIP = {'logo-bg.jpg'}

def extract_pairs(txt):
    """Return list of (image_file, alt/caption) from img tags + CSS url() backgrounds."""
    pairs = []
    for m in re.finditer(r'<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"', txt):
        pairs.append((os.path.basename(m.group(1)), m.group(2).strip()))
    for m in re.finditer(r'<img[^>]+alt="([^"]+)"[^>]*src="([^"]+)"', txt):
        pairs.append((os.path.basename(m.group(2)), m.group(1).strip()))
    return pairs

# list build dirs
dirs = sorted([d for d in os.listdir(BUILD) if os.path.isdir(os.path.join(BUILD,d)) and os.path.exists(os.path.join(BUILD,d,'index.html'))])

results = []  # (demo, file, caption, verdict)
for d in dirs:
    txt = open(os.path.join(BUILD,d,'index.html'), encoding='utf-8', errors='ignore').read()
    pairs = extract_pairs(txt)
    seen = set()
    for fname, alt in pairs:
        if fname in SKIP or 'before-real' in fname or 'after-real' in fname or fname.endswith('-poster.jpg'):
            continue
        key = (fname, alt)
        if key in seen:
            continue
        seen.add(key)
        fp = os.path.join(BUILD, d, fname)
        if not os.path.exists(fp):
            continue
        try:
            v = vision(fp, alt)
        except Exception as e:
            v = f'ERR {str(e)[:80]}'
        verdict = 'ON-TRADE' if v.strip().upper().startswith('ON-TRADE') else 'OFF-TRADE' if v.strip().upper().startswith('OFF-TRADE') else 'OTHER'
        results.append((d, fname, alt, verdict, v.replace('\n',' ')[:160]))
        print(f"[{verdict}] {d}/{fname} :: {alt}\n     {v[:150]}", flush=True)
        time.sleep(0.4)

print("\n\n===== OFF-TRADE / OTHER SUMMARY =====")
for d, fname, alt, verdict, v in results:
    if verdict != 'ON-TRADE':
        print(f"{d}/{fname} :: {alt}\n     {v}")
print("DONE")
