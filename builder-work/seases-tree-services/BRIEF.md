# Builder Task — Sease's Tree Services (fork `tree-service` premium template)

You are in `/mnt/d/LocalLaunch/builder-work/seases-tree-services/`. The premium `tree-service` template is copied here (index.html + hero.mp4/webm + hero-poster.jpg + services-bg.jpg + logo.png + work-a/b/c/d.jpg + deploy.py). TEMPLATE FORK: edit `index.html` + `deploy.py` only. Graft=0 is expected. Rebrand "Lumberjack Tree Service" (red accent) → Sease's Tree Services (amber accent). Do NOT restructure — rebrand ONLY.

## REAL FACTS (verified — use exactly)
- Business name: **Sease's Tree Services** (replace every "Lumberjack Tree Service")
- City: **Newberry, SC** (replace "Anderson")
- Phone: **(803) 276-1737** · tel: tel:+18032761737
- Owner: **David Sease**
- Tagline: **"Anything To Do With Trees"** (use as the hero eyebrow or a small tagline line)
- Reviews: **4.7★ / 12 Google reviews** (verified). Do NOT inflate.
- Slug (deploy.py PROJECT): **seases-tree-services-demo**
- ⚠️ No email/Facebook exists — if the template references an email or FB, replace with the phone or drop it. Do NOT invent an email.
- ⚠️ No "Est. 2014"/"12 years" claim (Lumberjack's) — replace with the tagline "Anything To Do With Trees" or "serving Newberry & the Midlands".

## BRAND COLORS — amber/gold accent (no brand found, so use a warm amber distinct from green). Recolor red → amber.
Replace `:root` OKLCH tokens (change HUE only, keep premium dark):
- `--color-orange: oklch(53.8% 0.208 27)` → `oklch(70% 0.13 80)`  (amber accent)
- `--color-orange-2: oklch(63% 0.16 27)` → `oklch(78% 0.12 80)`
- `--color-teal: oklch(55% 0.04 30)` → `oklch(60% 0.04 80)`
- `--color-neutral: oklch(55% 0.006 30)` → `oklch(55% 0.006 80)`
- `--color-focus: oklch(68% 0.17 27)` → `oklch(78% 0.12 80)`
- Recolor hardcoded gradients: `.hero__scrim` oklch hue 200 → 80; `.services-bg` gradient hue 30 → 80.
- Grep for remaining oklch hues 27/30/200 and make them amber (80). Leave paper/ink neutral hues (1, 146, 326) untouched.

## CONTENT REBRAND
- **Hero eyebrow**: "Newberry, SC · Anything To Do With Trees"
- **Hero H1**: "Trees Down. Worries Gone." (or keep structure, Sease's-flavored)
- **Hero lede**: "Safe tree removal, trimming, and expert tree care across Newberry and the Midlands — done right the first time, by a crew you can trust."
- **Services (the template has 6 cards — map to these 4 real services, drop the extras):**
  1. Tree Removal & Safe Felling
  2. Tree Trimming & Branch Removal
  3. Dead & Problem Tree Removal
  4. Expert Tree Care
- **Trust marquee items**: "4.7★ Rated" · "Anything To Do With Trees" · "Free Estimates" · "Serving Newberry & the Midlands"
- **Work gallery captions**: work-a = "Tree Removal" · work-b = "Trimming" · work-c = "Chipping & Cleanup" · work-d = "Dead Tree Removal" (images already in-dir).
- **Reviews**: replace Lumberjack's 1 review with these 2 real verbatim quotes:
  1. "We had 3 huge trees that we needed taken down that were right next to our outbuildings. David Sease and his team took all of the trees down with ease. How they managed to do this without damaging the buildings, I'll never understand. For as long as he is in business, he will be my first and only call for tree service." — **Sue Odom**, Google
  2. "I have known David for quite a few years. You will not find anyone more professional and knowledgeable in this field of work. I would highly recommend David." — **Bobby Stockman**, Google
- **About**: "Sease's Tree Services is a Newberry, SC tree care company led by David Sease. Anything to do with trees — safe removal, trimming, and problem-tree work near homes and outbuildings — we do it right the first time." (No fabricated founding year.)
- **Logo**: logo.png in-dir.

## HARD RULES (apply ALL)
0a. Amber/gold accent (given). No red, no Local Launch teal/slate.
2. Real HD backgrounds (video hero + services-bg). No plain-color cards.
3. Keep the premium frosted-glass cards.
5. Distinct images (hero video + services-bg + 4 work images all different).
6. No fabricated data — no invented email, founding year, or inflated review count (12 is verified).
8. FIRST-ITERATION CORRECTNESS: recolor every red/warm/blue hue (see above); no CSS syntax errors; gallery captions match images; never reuse hero poster as gallery.
9. Review count 4.7★/12 IS verified — show exactly that, no more.
10. Scrims/overlays stay DARK — amber is for ACCENTS ONLY.

## SELF-CERTIFY (end report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO, HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES, client-brand=YES (amber — no brand found), okLCH-hue-recolored=YES (27→80), scrims-dark=YES, no-fabricated-data=YES, checked-1280&390=NO (Supervisor verifies)."

Report concisely: what changed, final `:root` accent values, confirm no red hue (27) or Lumberjack strings remain.
