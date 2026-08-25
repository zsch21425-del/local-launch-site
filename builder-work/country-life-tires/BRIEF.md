# Builder Task — Country Life Tires & Service (PREMIUM rebuild on `tree-service` base)

You are in `/mnt/d/LocalLaunch/builder-work/country-life-tires/`. The premium `tree-service` template is copied here as a STRUCTURAL base (index.html + deploy.py + logo.png + hero-poster.jpg [auto shop] + services-bg.jpg [tires] + work-a/b/c/d.jpg [auto/tire scenes], all regenerated). Rebrand "Lumberjack Tree Service" (tree) → **Country Life Tires & Service** (auto repair & tires). KEEP the red accent (the template is already red-orange, hue 27 — this vertical's approved accent; do NOT recolor). KEEP the premium visual system. Graft=0 expected.

## REAL FACTS (verified — use exactly; do NOT invent)
- Business name: **Country Life Tires & Service**
- City: **Mauldin, SC** (serve "Mauldin & the Upstate")
- Phone: **(864) 991-8707** · tel: tel:+18649918707
- Owner: **Tony Gatto** (locally owned)
- Reviews: **477 Google reviews** (verified) + 2 verbatim quotes below
- Proof points: **ASE-certified techs**, **RepairPal Certified** (12-month/12,000-mile warranty), **AAA contractor** (towing)
- Slug (deploy.py PROJECT): **country-life-tires-demo**

## HERO — static Ken Burns (NO video, NO logo in the hero)
There is NO hero video (removed). Keep the `<img class="hero__poster-fallback">` → **hero-poster.jpg** (auto shop) with the Ken Burns zoom. Do NOT add a `<video>` element. Do NOT put a logo image in the hero — the hero should be clean: eyebrow + big display headline + lede + CTA only. (The logo appears only in the nav brand.)

## CONTENT REBRAND
- **Hero eyebrow**: "Mauldin, SC · Tires & Auto Repair"
- **Hero H1**: "Honest Tires." + accent "No Surprises." (or "Honest Tires & Auto Repair.")
- **Hero lede**: "Nitto, Continental, Goodyear and more — mounted, balanced, and serviced right. Brakes, diagnostics, and full auto repair from ASE-certified techs."
- **Services (map to 5 real services, drop the tree ones + change icons to wrench/tire/gauge icons):**
  1. Tire Sales & Mounting
  2. Brake Service
  3. Diagnostics
  4. General Repair
  5. Towing & Roadside (AAA contractor)
- **Trust marquee items**: "477 Google Reviews" · "ASE-Certified Techs" · "RepairPal Certified" · "12mo/12k Warranty" · "Serving Mauldin & the Upstate"
- **Work gallery captions** (match the auto images): work-a = "Tire Mounting" · work-b = "Brake Service" · work-c = "Diagnostics" · work-d = "General Repair"
- **Reviews** (2 verbatim):
  1. "My car has been serviced at Country Life since the day I got it. They are very honest and reasonable on prices. Best mechanic in town!" — **Laura Eddy**, Google
  2. "Honest, reliable service for years! I'd recommend Country Life to anyone!" — **Jenny Byrne**, Google
  Show "477 Google reviews" (verified) as the trust line.
- **About**: "Country Life Tires & Service is a locally owned shop serving Mauldin and the Upstate. Owner Tony Gatto and his team believe in fair prices, quality work, and treating every customer like a neighbor. From tire sales and mounting to brakes, diagnostics, and full repairs — ASE-certified, RepairPal Certified, with a 12-month/12,000-mile warranty."
- **Logo**: logo.png in-dir (nav brand only).

## HARD RULES (apply ALL)
0a. Red accent (keep the template's hue 27 — do NOT recolor). No Local Launch teal/slate.
2. Real HD backgrounds (hero-poster + services-bg). NO flat white cards — keep the frosted-glass depth cards.
3. Keep the frosted-glass card pattern (blur + shadow + rounded).
5. Distinct images — hero-poster (shop) + services-bg (tires) + 4 work images all different; NO tree imagery.
6. No fabricated data — real phone/owner/services/reviews. No fabricated prices or "since 19XX".
8. FIRST-ITERATION CORRECTNESS: no leftover tree service names or tree icons; gallery captions match auto images; no CSS/JS syntax errors.
9. Review count 477 IS verified — show it; do not invent a star rating or additional quotes.
10. Scrims stay DARK — red for ACCENTS ONLY.

## SELF-CERTIFY (end report with this exact stamp)
SELF-CERTIFY: "graft-used=NO, visualizer=NO (auto repair is not a transform trade), HD-bg=YES, premium-cards=YES (frosted glass, NOT flat white), distinct-images=YES, no-tree-content=YES, no-hero-video=YES (static Ken Burns), no-hero-logo=YES, client-brand=YES (red accent kept), scrims-dark=YES, no-fabricated-data=YES, checked-1280&390=NO (Supervisor verifies)."

Report concisely: what changed, confirm no "Lumberjack"/tree content/hero.mp4/white cards remain, and the hero is a clean no-logo Ken Burns header.
