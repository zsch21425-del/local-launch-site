# Landscaper Template — Local Launch Demos

**Design source (2026-08-07):** the **Palmetto Landscaping demo** — the proven, user-approved landscaping quality bar. Live reference: `https://palmetto-landscaping-demo.vercel.app`. Structure = nav → hero → **motion-bg services** → real-photo gallery → **reviews+about over shared front-yard video** → CTA → Local Launch bottom.

**⚠️ COLOR RULE (Aug 2026):** use the demo's DESIGN, NOT its colors. Research the prospect's actual brand first (logo colors, social cover photo, equipment colors, existing materials, marketing flyers) and set the `:root` tokens to THEIR colors. Default tokens are a neutral teal/rust placeholder — always override for the prospect.

**Palette tokens (in `:root`):** `--brand` (primary dark) · `--brand-dark` (nav/footer) · `--brand-pale` (icon chip tint) · `--accent` (secondary) · `--accent-light` · `--paper` (page bg)
**Fonts:** Playfair Display (headings) + Inter (body).

## When to Use
Any landscaping / lawn care / hardscaping / outdoor services prospect that qualifies as NO-WEBSITE, PARKED, or SOCIAL-ONLY (see `local-business-prospecting` Phase 1.5).

## How to Fork (per prospect)

```bash
mkdir -p /mnt/d/LocalLaunch/demos/<slug>
cp -r /mnt/d/LocalLaunch/templates/landscaper/* /mnt/d/LocalLaunch/demos/<slug>/
```

Then edit `index.html`:
1. **Set `:root` tokens to the prospect's brand colors** (research first — see color rule above)
2. **Set `deploy.py` PROJECT** = `<slug>-demo` (the `REPLACE-WITH-SLUG-DEMO` constant)
3. Replace every `{{PLACEHOLDER}}`:

| Placeholder | Meaning |
|---|---|
| `{{BUSINESS_NAME}}` / `{{CITY}}` | Legal/active brand name + primary service city |
| `{{PHONE}}` / `{{PHONE_LINK}}` | Display + `tel:` link format |
| `{{META_DESC}}` / `{{SLUG}}` | Meta description + vercel slug (used in OG tags) |
| `{{HERO_BADGE}}` / `{{HERO_HEADLINE_1}}` / `{{HERO_ACCENT}}` | Badge text + headline + accent word |
| `{{HERO_SUB}}` | 1-2 line value prop |
| `{{PROOF_1..3}}` | Real proof: review %, years serving, service list |
| `{{SERVICES_LEDE}}` + `{{SERVICE_1..4_NAME/DESC/ICON}}` | Real services from their page/Thumbtack; icon = FontAwesome class |
| `{{GALLERY_LEDE}}` + `{{WORK_1..4_ALT/CAP}}` | Real work photos from Nextdoor/FB/IG gallery + captions |
| `{{REVIEWS_LEDE}}` + `{{REVIEW_1..2_TEXT/NAME/TIME/SOURCE}}` | REAL reviews only (Thumbtack/GBP/Facebook) — never fabricate |
| `{{ABOUT_H2}}` / `{{ABOUT_P1/P2/HIGHLIGHT}}` | Owner story, years, license, service area |
| images | `hero.jpg`, `work-a..d.jpg`, `about.jpg` — real photos, saved locally |

## Motion Backgrounds (the proven Palmetto pattern)

The template ships with 3 looping background videos (all pre-compressed for Vercel):

| File | Where | Notes |
|---|---|---|
| `bg-services.mp4` + poster | Services section, sticky 100vh behind cards | Grass/lawn close-up; `#services .services-bg` is `position:sticky; top:0; height:100vh`, content pulled up with `margin-top:-100vh` |
| `reviews-bg-desktop.mp4` + poster | Reviews + About shared bg (`.frontyard-wrap`), desktop ≥640px | Landscape clip |
| `reviews-bg-mobile.mp4` + poster | Same wrap, mobile ≤640px (`display:none`/`block` swap) | Vertical clip |

**Prefer the prospect's own footage** when they have clips (Palmetto used Zach's phone clips). Replace the files, keep filenames. Poster frame = `ffmpeg -i in.mp4 -vf "select=eq(n\,30)" -frames:v 1 -q:v 2 poster.jpg`.

**Vercel upload rule (CRITICAL):** files >~4MB are silently dropped by the upload endpoint → compress every video to **≤~4MB** before deploy (`libx264 -crf 24-28 -preset slow -pix_fmt yuv420p -movflags +faststart -an`). For soft/short footage, **upscale + sharpen** first: `scale=1920:-2:flags=lanczos,unsharp=5:5:0.6:5:5:0.0`. After deploy, **md5-verify the served file vs local** — the plain URL can serve a stale CDN copy for minutes; a `?v=` cache-buster confirms.

## Text-over-video rules (proven fixes from Palmetto rounds)
- Headings over video get **white + dark text-shadow** (`.frontyard-wrap h2` / `#services h2` patterns): `color:#fff; text-shadow:0 2px 10px rgba(0,0,0,.6),0 0 3px rgba(0,0,0,.45)`
- Lede paragraphs over video: white ~95% + shadow
- Review/about cards over video: **94% opaque** white + light blur — never less (0.78 was unreadable)
- Placeholder cards: same 94% opacity (removed the old 0.6 — it made some cards look transparent vs others)
- **No grey floating text directly on the video** under cards — the old "A professional website + local SEO..." line was removed (unreadable + blurry look)

## Hard Rules (inherited from demo-assembly + Hallmark)
1. **Real photos first** — pull logo + work shots from their Facebook/Nextdoor/Instagram before generating AI. AI = fallback only.
2. **Real reviews only** — no fabricated testimonials ever. If <3 real reviews, use honest placeholder cards ("— Real review coming soon —").
3. **No raw hex outside `:root`** — all colors via `var(--token)`.
4. **`overflow-x: clip`** on html AND body (never `hidden`).
5. **Roman headers only** — no italic headings (Hallmark gate 38a).
6. **Hallmark critique stamp** at top of `<style>` — update scores after each build.
7. **Mobile QA mandatory** — inject 375px viewport, check scrollWidth vs clientWidth on all text, verify no body horizontal scroll. See `walkthrough-demo-quality-gates` gate #10.
8. **OG tags required** before sending the link (title/description/image/url + twitter:card).
9. **Deploy as `<slug>-demo.vercel.app`** — edit `deploy.py` PROJECT constant first.
10. **Demo + pitch to Zach before any prospect send** — never skip the approval gate.

## Template Structure (sections)
1. **Nav** — fixed, brand-dark, brand + Free Estimate CTA
2. **Hero** — real work photo bg, badge, Playfair headline with accent word, proof row, phone + services CTAs
3. **Services** — 4 icon cards over **sticky 100vh grass video** (white+shadow headings, translucent cards)
4. **Gallery** — brand-dark band, real job photos with location captions
5. **Reviews + About** — shared **front-yard video background** (desktop landscape + mobile vertical clips), white+shadow headings, 94% opaque cards, About in white panel
6. **CTA** — solid brand band OUTSIDE the video wrap ("This is yours, [Business].")
7. **Logo / CTA Text / Contact** — Local Launch bottom (standard)

## Vertical Templates (one per trade)
- **landscaper/** — this one (**Palmetto demo structure — proven quality bar, 2026-08-07**: 3 motion backgrounds, front-yard video wrap for reviews+about, white+shadow headings over video; colors per prospect)
- **cleaning/** — from Mom & A Mop site (warm taupe/cream + deep brown + blush, Playfair + DM Sans)
- Plumbing, auto, etc. — create from the best proven prospect demo per vertical, same placeholder convention.
