# Builder Task — Cooper's Plumbing Company Inc (fork `plumbing` template)

You are in `/mnt/d/LocalLaunch/builder-work/coopers-plumbing/`. The `plumbing` template is already copied here in full (index.html + plumbing-faucet-web.mp4/.poster + plumbing-drain-web.mp4/.poster + logo.png + about.jpg + deploy.py). This is a TEMPLATE FORK: edit `index.html` in place and `deploy.py` only. Do NOT touch other files. Graft=0 is expected and fine here (you have everything in-dir) — do not waste calls on graft.

## REAL FACTS (all verified — use exactly these, do not invent)
- Business name: **Cooper's Plumbing Company Inc**
- City: **Aiken, SC** (serve "Aiken & the CSRA")
- Phone display: **(803) 648-0203** · tel link: **tel:+18036480203**
- Address: 2172 Whiskey Rd, Aiken, SC 29803
- Owner: **Sammy Cooper** · Family-owned & operated **since 1985** (nearly 40 years)
- Slug (deploy.py PROJECT + og:url): **coopers-plumbing-demo**

## BRAND COLORS (researched: charcoal truck + red accents)
Replace the `:root` tokens AND every hardcoded rgba() in backgrounds/overlays/scrims:
- `--royal: #1a1b1c` (charcoal — primary dark)
- `--royal-dark: #141516` (nav)
- `--royal-deep: #0e0f10` (page bg)
- `--gold: #a3312f` (red accent)
- `--gold-light: #c0392b`
- `--cream: #F7F3EC` (keep light section)
- **Recolor EVERY hardcoded rgba()** left from the purple template: nav `rgba(38,21,68,0.92)` → `rgba(20,21,22,0.92)`; hero-scrim + services-scrim `rgba(26,14,48,…)` → `rgba(14,15,16,…)` (same opacities); hero-badge border `rgba(212,164,55,0.4)` → `rgba(163,49,47,0.4)`; `.btn-phone`/`.cta-btn` shadows `rgba(212,164,55,…)` → `rgba(163,49,47,…)`. Changing only `:root` is NOT enough — grep for the old purple rgba triplets (38,21,68 / 26,14,48 / 212,164,55) and replace ALL of them.

## SECTION CONTENT
- **Meta title/description/og**: "Cooper's Plumbing Company Inc — Aiken, SC" · "Family-owned plumbing in Aiken, SC since 1985. Leak repair, drain cleaning, water heaters & general plumbing. Call (803) 648-0203."
- **Hero badge**: "Aiken's Family-Owned Plumbing Team"
- **Hero H1**: "Plumbing Done" + accent span "Right Since 1985" (the accent span is currently "Right, {{BUSINESS_NAME}}" — replace its text with "Right Since 1985")
- **Hero subtitle**: "Leak repair, drain cleaning, and water heater service for homes across Aiken and the CSRA. Honest work from Sammy Cooper's family-run crew."
- **Hero proof row (3)**: "Family-Owned Since 1985" · "Honest, Upfront Pricing" · "Serving Aiken & the CSRA"
- **Services (4 cards — replace titles + descriptions)**:
  1. **Leak Repair** — "Expert leak detection and repair for pipes, faucets, and water lines — diagnosed fast, fixed right the first time."
  2. **Drain Cleaning** — "Professional drain snaking and clog removal to keep your pipes flowing freely."
  3. **Water Heaters** — "Repair and installation for tank and tankless water heaters — hot water when you need it."
  4. **General Plumbing Repairs** — "From toilets to fixtures, honest plumbing repairs for your whole home."  (⚠️ do NOT use "24/7 Emergency" — not verified)
- **Services lede**: "From leak repair to full water heater service — Cooper's Plumbing delivers honest, professional work you can count on."
- **Reviews section (IMPORTANT — the business has a LOW 3.2★ rating, so do NOT show any star ratings)**: remove the `review-stars` div from BOTH cards (the hardcoded ★★★★★ would be a false claim). Use these two REAL verbatim quotes:
  - Card 1: "Great service when I had a leak with my water box. The plumber, Winston, was very knowledgeable, respectful and took care of the problem promptly! I would highly recommend Cooper's Plumbing for any of your plumbing needs!" — author "Verified Customer" · source "BestProsInTown · Sep 2019"
  - Card 2: "I would like to commend and highly recommend this company. They went above and beyond the call of duty. Very honest and showed up on time. Very punctual and they have a very Christ-centered humbleness which I absolutely loved. They have very reasonable rates that most would be able to afford." — author "Verified Customer" · source "BestProsInTown · Sep 2018"
  - Reviews lede: "Honest work, fair prices, and a family-run crew since 1985."
- **About H2**: "Family-Owned & Operated Since 1985"
- **About P1**: "Cooper's Plumbing Company Inc has been serving Aiken and the surrounding CSRA for nearly 40 years. Owner Sammy Cooper built the business on honest work, fair pricing, and showing up on time."
- **About P2**: "From leak repair and drain cleaning to water heater service, our family-run crew treats every home like our own."
- **About highlight**: "Family-owned since 1985 — call (803) 648-0203 today."
- **About image**: use `about.jpg` (NOT the logo) — set the about-section `<img src="about.jpg" alt="Cooper's Plumbing — family-owned plumbing in Aiken, SC">`
- **Logo**: `{{LOGO_IMG}}` → `logo.png` in nav + hero. alt "Cooper's Plumbing Company Inc logo".
- Keep the video sources as-is (plumbing-faucet-web.mp4 + plumbing-drain-web.mp4 + their posters) — these are the hero + services backgrounds.
- Keep the Local Launch footer (logo-bg.jpg, (503) 358-5860, locallaunchupstate@gmail.com) unchanged.

## HARD RULES (apply ALL — do NOT omit any)
0a. CLIENT BRAND COLORS — you were given Cooper's researched charcoal `#1a1b1c` + red `#a3312f`. Use ONLY these. No Local Launch teal/slate, no guessed colors.
2. REAL HD BACKGROUNDS on hero + services (the videos provide this). NO plain solid-color cards — the service cards are translucent white over the video (keep that pattern).
3. PREMIUM DEPTH CARDS — keep the template's frosted/translucent card pattern (elevated, blur, soft shadow, rounded).
5. EVERY image distinct — hero=faucet video, services=drain video, about=about.jpg (a different, real plumbing scene). No reusing the same image across sections.
6. NO fabricated data — real phone/owner/services/reviews as given. NO fake review counts or star ratings.
8. FIRST-ITERATION CORRECTNESS: (a) recolor EVERY hardcoded rgba() (see above); (b) no CSS syntax errors; (c) every image reference matches an on-trade plumbing asset; (d) never reuse a video poster as a gallery image.
9. NEVER cite an unverified review count/rating — Cooper's is 3.2★ (low), so the demo shows NO star rating, only the two real verbatim quotes + "since 1985" proof. Do not add stars anywhere.
10. SCRIMS/OVERLAYS must be the DARK charcoal (near-black) at the same opacities — the RED is for ACCENTS ONLY (buttons, badge border, shadows, highlights). Do NOT make any scrim red.

## SELF-CERTIFY (end your report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO (not a transform trade), HD-bg=YES, premium-cards=YES, distinct-images=YES, poster=first-frame=YES (template videos), client-brand=YES (charcoal #1a1b1c + red #a3312f), rgba-recolored=YES, services-bg-full=YES, scrims-dark=YES, no-stars=YES (3.2★ honest), checked-1280&390=NO (Supervisor verifies)."

When done, report concisely: what you changed, the final `:root` token values, and confirm no purple rgba() triplets remain.
