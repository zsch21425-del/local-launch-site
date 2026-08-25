# FIX BRIEF — L&P Lawncare demo: move video to the HERO

## The problem (Zach's correction — do exactly this)
The full-bleed looping video background is currently on the **SERVICES** section (bottom of page).
It MUST be on the **HERO** instead.

Zach's premium standard:
- **HERO** = full-bleed autoplay video background.
- **SERVICES** = static section (NO video, NO sticky, NO parallax).

## Exact changes — edit `index.html` in THIS directory ONLY

### 1. HERO — convert from static image to full-bleed VIDEO
Current markup has `<div class="hero-bg"></div>` and CSS:
`.hero-bg { position: absolute; inset: 0; background: url('hero.jpg') center/cover no-repeat; filter: brightness(0.45) saturate(1.1); transform: scale(1.06); transition: transform 12s ease; }`
plus `.hero:hover .hero-bg { transform: scale(1.0); }`.

Change to a video background:
- Replace the `<div class="hero-bg"></div>` element with:
  `<video class="hero-bg" autoplay muted loop playsinline preload="auto" poster="hero.jpg" aria-hidden="true"><source src="bg-services.mp4" type="video/mp4"></video>`
- Update the CSS rule for `.hero-bg` to:
  `.hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.5) saturate(1.1); }`
- DELETE the `.hero:hover .hero-bg { transform: scale(1.0); }` rule (no more zoom transform; video does not need it).

### 2. SERVICES — remove the video entirely, make it STATIC
Current markup has this block inside `#services`:
```
<div class="services-bg">
  <video ... poster="bg-services-poster.jpg" ...><source src="bg-services.mp4" ...></video>
  <div class="services-scrim"></div>
</div>
```
- DELETE the entire `<div class="services-bg">...</div>` block (the video + scrim).
- Change `#services.services-section` so it has a STATIC background — a solid neutral dark background (e.g. `background: #334154;` or `var(--ink)`) is fine. Remove `url('bg-services-poster.jpg')` from its background.
- DELETE these CSS rules (they belong to the old sticky/parallax pattern):
  - `#services .services-bg { ... position: sticky ... }`
  - `#services .services-bg video { ... }`
  - `#services .services-scrim { ... }`
- Change `#services .services-inner` — remove `margin-top: -100vh` (set to `margin-top: 0`), keep its padding + max-width + centering.
- Make the `.service-card` cards SOLID (they currently use a translucent frosted-glass background over the video):
  - Change `.service-card` background from `rgba(255,253,247,0.85)` + `backdrop-filter` to a solid card background (e.g. `background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);` so they read as clean cards on the dark static background, OR solid `var(--white)` with dark text). Keep them legible and premium. Keep the icons + titles + descriptions as-is.

### 3. DO NOT touch anything else
- Gallery section (`work-a.jpg` … `work-d.jpg`) — leave as-is.
- Reviews section (`reviews-bg-*.mp4` video backgrounds) — leave as-is.
- Hero content (headline, subtitle, proof, CTAs, phone number) — leave the TEXT as-is.
- Do NOT change the phone number `(864) 612-3912`, owner name, reviews, or services copy.

## HARD RULES (non-negotiable)
- No people in any image/video. No AI-speak. No invented facts.
- Brand = slate-blue `#5B6F8E` / white. Do not introduce new brand colors.
- Verify by reading the file back after editing (grep for `position: sticky`, `margin-top: -100vh`, `bg-services-poster`, `backdrop-filter` — all must be GONE from the services section; the hero must contain the `<video>`).

## Self-certify (include this checklist in your final message)
- [ ] Hero has a full-bleed autoplay video (`bg-services.mp4`), `object-fit: cover`, no gaps.
- [ ] Services section has NO video, NO `position: sticky`, NO `margin-top: -100vh`, NO `backdrop-filter` on cards.
- [ ] Services is a static dark section with solid legible cards.
- [ ] No other section was changed.
