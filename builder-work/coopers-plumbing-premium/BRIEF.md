# Builder Task — Cooper's Plumbing Company Inc (premium OKLCH rebuild)

You are in `/mnt/d/LocalLaunch/builder-work/coopers-plumbing-premium/`. This directory is a **full copy of the premium `tree-service` template** (OKLCH colors, video hero + trust marquee + sticky-HD-bg frosted-glass service cards + gallery + testimonials + contact + Local Launch footer). This is a **TEMPLATE FORK + full-trade rebrand**: plumbing ≠ tree, so replace ALL tree content with plumbing content. Edit `index.html` in place (and `deploy.py` if its slug needs the Cooper's project name — see below). Do NOT touch other files. Graft=0 is expected and fine (everything you need is in-dir); do not waste calls on graft.

## REAL FACTS (all verified — use exactly these, do NOT invent)
- Business: **Cooper's Plumbing Company Inc**
- City: **Aiken, SC** — service area copy = "Aiken & the CSRA"
- Phone display: **(803) 648-0203** · tel link: **tel:+18036480203**
- Email (contact section): **coopersplumbinginc@gmail.com**
- Address: 2172 Whiskey Rd, Aiken, SC 29803
- Owner: **Sammy Cooper** · family-owned & operated **since 1985** (nearly 40 years)
- Slug (deploy.py project name + og:url): **coopers-plumbing-demo**
- ⚠️ **3.2★ LOW rating** — show NO star ratings anywhere. Only the 2 verbatim quotes below.

## BRAND COLORS (charcoal + red, researched from Cooper's truck)
Replace the `:root` `--color-*` OKLCH tokens with these EXACT values (keep the same var names):
- `--color-paper` → `oklch(22.1% 0.003 248)` (charcoal page bg)
- `--color-paper-2` → `oklch(31% 0.004 248)` · `--color-paper-3` → `oklch(35% 0.004 248)` (raised surfaces)
- `--color-ink` → `oklch(97.5% 0.002 146)` (light text — keep near-current)
- `--color-teal` (secondary/muted accent) → `oklch(45% 0.03 25)` (muted red-gray)
- `--color-orange` (PRIMARY accent) → `oklch(48.5% 0.15 26)` (Cooper's red #a3312f)
- `--color-orange-2` (accent hover) → `oklch(54.3% 0.174 30)` (red-light #c0392b)
- `--color-accent-ink` → `oklch(18% 0.003 1)` (text on accent)
- `--color-focus` → `oklch(62% 0.15 28)` (focus ring)
- Also grep for any hardcoded hex/`rgba()`/`color-mix` values carrying the old red/dark and recolor to the above. RED is ACCENT-ONLY (buttons, icon chips, badge borders, marquee dot, focus ring); every scrim/overlay/section background must stay DARK charcoal (never red).

## MEDIA (already staged in this dir — just reference them, do NOT regenerate)
- Hero video: `hero.mp4` + `hero.webm` + `hero-poster.jpg` (a faucet running — on-trade) — keep the `<video>` hero, no static swap, no hero logo.
- Services sticky bg: `services-bg.jpg` (a drain/water scene) — keep `url('services-bg.jpg')`.
- Gallery (4): `work-a.jpg` (faucet/leak), `work-b.jpg` (drain cleaning), `work-c.jpg` (water-heater repair), `work-d.jpg` (general plumbing under-sink).
- Footer logo: `logo-bg.jpg` (Local Launch) — keep.
- `logo.png` is Cooper's real logo but the premium nav is TEXT — use text brand "Cooper's Plumbing", do NOT add a logo to nav or hero.

## SECTION CONTENT (replace tree → plumbing)
- **Meta title**: "Cooper's Plumbing Company Inc — Aiken, SC | Leak Repair, Drain Cleaning & Water Heaters"
- **Meta description**: "Family-owned plumbing in Aiken, SC since 1985. Leak repair, drain cleaning, water heater service & general plumbing. Call (803) 648-0203."
- **Nav brand text**: "Cooper's Plumbing" · **Nav phone**: (803) 648-0203 / `tel:+18036480203`
- **Hero eyebrow**: "Aiken's Family-Owned Plumbing Team"
- **Hero H1**: "Plumbing Done Right Since 1985" (use the red accent on "Right Since 1985" if the template has an accent span)
- **Hero lede**: "Leak repair, drain cleaning, and water heater service for homes across Aiken and the CSRA — honest work from Sammy Cooper's family-run crew."
- **Trust marquee (VERIFIED only — 3 items, replace all 5 tree items + icons)**: "Family-Owned Since 1985" · "Honest, Upfront Pricing" · "Serving Aiken & the CSRA" (drop "24/7 Emergency", "Veteran & Senior Discounts", "Free Estimates", "12 Years" — none verified). Keep the marquee animation.
- **Services lede**: "Honest, professional plumbing for homes and businesses across Aiken and the CSRA."
- **Services (change from 6 tree cards → 4 plumbing cards — remove 2 cards and set the grid to a clean 2×2 or 4-up layout; replace tree icons with plumbing icons: wrench, droplet, flame/heater, pipe):**
  1. **Leak Repair** — "Expert leak detection and repair for pipes, faucets, and water lines — diagnosed fast, fixed right the first time."
  2. **Drain Cleaning** — "Professional drain snaking and clog removal to keep your pipes flowing freely."
  3. **Water Heaters** — "Repair and installation for tank and tankless water heaters — hot water when you need it."
  4. **General Plumbing Repairs** — "From toilets to fixtures, honest plumbing repairs for your whole home."
- **About H2**: "Family-Owned & Operated Since 1985"
- **About P1**: "Cooper's Plumbing Company Inc has been serving Aiken and the surrounding CSRA for nearly 40 years. Owner Sammy Cooper built the business on honest work, fair pricing, and showing up on time."
- **About P2**: "From leak repair and drain cleaning to water heater service, our family-run crew treats every home like our own."
- **Reviews (2 cards, NO stars)**: replace the tree testimonial with these two verbatim quotes, author "Verified Customer", source "BestProsInTown":
  1. "Great service when I had a leak with my water box. The plumber, Winston, was very knowledgeable, respectful and took care of the problem promptly! I would highly recommend Cooper's Plumbing for any of your plumbing needs!" — BestProsInTown · Sep 2019
  2. "I would like to commend and highly recommend this company. They went above and beyond the call of duty. Very honest and showed up on time. Very punctual and they have a very Christ-centered humbleness which I absolutely loved. They have very reasonable rates that most would be able to afford." — BestProsInTown · Sep 2018
- **Gallery lede**: "Real plumbing work, completed across Aiken and the CSRA."
- **Gallery captions** (match the 4 images in order): "Leak Repair" / "Drain Cleaning" / "Water Heater Service" / "General Plumbing"
- **Service area**: replace "Anderson, SC" / "the Upstate" with "Aiken, SC" / "the CSRA" everywhere.
- **Contact**: phone (803) 648-0203, email coopersplumbinginc@gmail.com, address 2172 Whiskey Rd, Aiken, SC 29803.
- **Footer**: KEEP the Local Launch credit exactly as-is (logo-bg.jpg, "Website built by Local Launch" linked → `https://locallaunchupstate.com`, phone (503) 358-5860, locallaunchupstate@gmail.com). Do NOT change it.

## REMOVE every trace of the tree template
Grep and eliminate ALL: "Lumberjack", "Christopher McCollum", "(864) 642-7705", "864-642-7705", "Ljtreeserviceasc@gmail.com", "Anderson, SC", "Est. 2014", "12 years", "24/7 Emergency", "tree", "arborist", "stump", "trimming", "bucket truck", "storm damage", "Ken Lovingood". Recolor the tree SVG icons (i-tree etc.) or replace with plumbing SVG icons.

## HARD RULES (apply ALL — hard-won from Zach rejection rounds, DO NOT omit)
1. VISUALIZER — plumbing is NOT a transform trade → visualizer=NO (correctly absent).
2. REAL HD BACKGROUNDS — hero is video; services bg is `services-bg.jpg`; NO plain solid-color cards (keep the frosted-glass cards over the sticky bg).
3. PREMIUM DEPTH CARDS — keep the template's frosted-glass card pattern (backdrop-blur + color-mix + soft shadow + rounded corners). Do not flatten.
5. EVERY image distinct — gallery = 4 unique plumbing photos; never reuse the hero poster as a gallery image.
6. NO fabricated data — real phone/owner/services/reviews as given; NO invented review counts, NO star ratings (3.2★ is low), no "24/7", no "licensed & insured".
8. FIRST-ITERATION CORRECTNESS — (a) recolor EVERY hardcoded color/color-mix left from the tree build; (b) no CSS syntax errors; (c) every image reference matches a real on-trade plumbing asset; (d) services-bg gradient/scrim fills the full section (no white/near-black fallback); (e) no leftover tree strings.
9. NO unverified review count/rating — Cooper's is 3.2★; show ONLY the 2 verbatim quotes + "since 1985" proof. No stars.
10. SCRIMS DARK — every scrim/overlay/section background is dark charcoal (oklch ≤ ~35% L); RED is accents only.

QA before done (8.5 visual gate):
- (a) redundancy guardrail: `/home/zach/hermes-agent/venv/bin/python3 /mnt/d/LocalLaunch/tools/check_redundancy.py /mnt/d/LocalLaunch/builder-work/coopers-plumbing-premium`
- (b) grep the file: 0 occurrences of any tree/old-client string; every `url()`/`src`/`poster` points to a file that exists in this dir.
- (c) self-review for text overlap / cut CTAs / broken layout at a glance.

## SELF-CERTIFY (end your report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO (not a transform trade), HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES (staged video), client-brand=YES (charcoal oklch 22.1% + red oklch 48.5% 0.15 26), colors-recolored=YES, services-bg-full=YES, scrims-dark=YES, no-stars=YES (3.2★ honest), no-tree-strings=YES, checked-1280&390=NO (Supervisor verifies)."

When done, report concisely: what you changed, the final `--color-*` token values, and confirm 0 tree/Lumberjack/Anderson/old-phone strings remain.
