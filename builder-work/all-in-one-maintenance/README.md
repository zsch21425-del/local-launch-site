# Junk Removal Template — Local Launch Demos

**Design pattern (2026-08-09):** dark full-bleed motion, premium glassmorphism. Built for
**Jackson's Junk and Stuff** (junkiest junk-removal need: furniture, appliances, garage/estate
cleanouts) and any junk-removal / hauling / decluttering prospect.

Forks the **pressure-washing template's** proven architecture (dark glass cards + real AI visualizer
+ motion-through-sections). This is the industry variant for junk removal / hauling.

## Design pillars (shared with the whole family — NO white backgrounds, NO flat cards)

- **Motion carries through the section stack.** The junk-motion video runs through
  hero → **Why Choose Us** (dark video bridge) → **AI Visualizer** → **Services** (sticky-100vh video
  behind translucent cards). No jarring white gaps.
- **Premium glassmorphism cards.** Every card (why / service / review) uses a translucent
  `linear-gradient` glass fill + `backdrop-filter: blur(14px)` + a glowing gradient top accent bar +
  deep shadows + gradient icon blocks. Hover lifts them.
- **Real AI visualizer** (see below) with real before/after sample photos.

## AI Visualizer — "Clear It Now" (Gemini)

Same working AI before/after as pressure-washing, for junk removal:

- Shows a cluttered-space photo with **📷 Use My Photo** (upload) + **Clear It Now** (gen button).
- Clicking it calls the Vercel serverless function `/api/clean-driveway` (Flask), which sends the
  photo to **`gemini-3-pro-image`** with the instruction *"remove all clutter, boxes, furniture,
  appliances… make it completely empty, swept, and clean"* and returns the generated empty image.
- Slider compares **before (cluttered) vs after (cleared)**.
- Sample images: `junk-before-real.jpg` (cluttered), `junk-after-real.jpg` (cleared) — replace per
  prospect.

> NOTE: the serverless file is still named `clean-driveway.py` and served at `/api/clean-driveway`
> for consistency with `vercel.json` routes + the JS `fetch`. Its INSTRUCTION text is junk-removal.
> Renaming the endpoint id not required — it's an internal API path, invisible to visitors.

## Deployment (Vercel CLI — required for the Python serverless function)

```bash
cd <your-fork-dir>
npx vercel env add GEMINI_API_KEY                                       # visualizer
npx vercel env add VISUALIZER_SAMPLE                                     # e.g. https://<slug>-demo.vercel.app/junk-before-real.jpg
npx vercel deploy --prod --yes
```

`vercel.json` routes `/api/clean-driveway` → `api/clean-driveway.py` (Flask). `requirements.txt`
installs Flask. The raw deploy.py approach does NOT build serverless functions — use the CLI.

## Fork steps

1. `mkdir demos/<slug> && cp -r templates/junk-removal/* demos/<slug>/`
2. Fill the 16 `{{PLACEHOLDERS}}` (`{{BUSINESS_NAME}}`, `{{CITY}}`, `{{STATE_ABBR}}`, `{{REGION}}`,
   `{{PHONE}}`, `{{PHONE_LINK}}`, `{{HERO_HEADLINE_1/2}}`, `{{OWNERSHIP}}`, `{{LOCAL_TRUST}}`,
   `{{ABOUT_OWNER}}`, `{{REVIEW_*}}`, `{{LOGO_IMG}}`, `{{SLUG}}`).
3. Swap the real before/after photos (`junk-before-real.jpg` / `junk-after-real.jpg`).
4. Set env vars + `npx vercel deploy --prod --yes`.

## Content rules

- **REAL REVIEWS ONLY** — the template ships one real verified testimonial + an honest placeholder.
  Never invent a review.
- Real, honest copy. No fabricated claims. The Gemini "clear it" generates the empty space honestly
  from the uploaded before.
- Tokenized colors (zero raw hex outside `:root`), `overflow-x: clip`, roman headers, glass cards.

## File inventory

```
index.html                     tokenized page (dark glass, motion-through, AI visualizer)
api/clean-driveway.py          Flask serverless → gemini-3-pro-image "clear this space"
vercel.json                    routes + builds (static + python function)
requirements.txt               Flask
junk-before-real.jpg           sample cluttered space → "before"
junk-after-real.jpg            sample cleared space → "after"
junk-hero-web.mp4 / _poster    junk-removal hero/services motion
logo-bg.jpg                    Local Launch bottom image
README.md
```
