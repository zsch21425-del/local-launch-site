# Pressure Washing Template — Local Launch Demos

**Design pattern (2026-08-09):** dark full-bleed motion (not white-background). Built for **Green Suds Pressure Washing** and any pressure-washing / soft-wash / exterior-cleaning prospect.

## Design pillars (per Zach — NO white backgrounds, NO flat cards)

- **Motion carries through the section stack.** The pressure-washing video background runs through
  hero → **Why Choose Us** (dark video bridge) → **AI Visualizer** → **Services** (sticky-100vh video
  behind translucent cards). There are no white/Jarring gaps between the motion sections.
- **Premium glassmorphism cards, not flat white.** Every card (why / service / review) uses a
  translucent `linear-gradient` glass fill + `backdrop-filter: blur(14px)` + a glowing
  `linear-gradient` top accent bar + deep depth shadows + gradient icon blocks. Hover lifts the card.
- **Real before/after visuals** in the AI Visualizer (see below).
- **Less white:** the only light theming left is the `.light-section` CSS class definition (unused);
  all actual sections are dark (`dark-section` / `why-section` / `services-section`).

## AI Visualizer — "Clean My Driveway" (Gemini)

A real, working AI-powered before/after, not a static image pair:

- Shows a driveway photo with **📷 Use My Photo** (upload) + **✨ Clean My Driveway** (gen button).
- Clicking Clean calls the Vercel serverless function `/api/clean-driveway` (Flask), which sends
  the photo to **`gemini-3-pro-image`** with the instruction *"deep-clean this concrete driveway
  with a pressure washer"* and returns the generated clean image.
- The slider then compares **before (original/uploaded) vs after (Gemini-cleaned)**.
- Sample images: `driveway-before-real.jpg` (dirty), `driveway-after-real.jpg` (clean) — replace
  per prospect or keep as the demo pair.

## Deployment

This template now uses the **Vercel CLI** (`npx vercel deploy`) — NOT the old raw deploy.py — because
the AI visualizer needs a **Python serverless function**, which the raw files API doesn't build.

```bash
cd <your-fork-dir>
# 1. Set project env vars (once):
npx vercel env add GEMINI_API_KEY     # value: the Gemini API key for the visualizer
npx vercel env add VISUALIZER_SAMPLE  # e.g. https://<slug>-demo.vercel.app/driveway-before-real.jpg
# 2. Deploy (builds the api/clean-driveway.py serverless function + static site):
npx vercel deploy --prod --yes
```

The `vercel.json` routes `/api/clean-driveway` → `api/clean-driveway.py` (Flask). `requirements.txt`
installs Flask on the Vercel Python runtime.

## Fork status

This fork is already rebranded for the prospect — all placeholder tokens filled, zero remaining.
To deploy: set env vars (GEMINI_API_KEY, VISUALIZER_SAMPLE) then `npx vercel deploy --prod --yes`.


## Content rules

- **REAL REVIEWS ONLY.** The template ships one real, verified testimonial as an example + an honest
  "--- Real review coming soon ---" placeholder. Never invent a review.
- Real physics / honest copy. No fabricated claims, no fake before/after (Gemini generates the after
  honestly from the uploaded before).
- All placeholders tokenized — zero raw hex outside `:root`, `overflow-x: clip`, roman headers.

## File inventory

```
index.html                     tokenized page (dark glassmorphism, motion-through)
api/clean-driveway.py          Flask serverless → gemini-3-pro-image "clean my driveway"
vercel.json                    routes + builds (static + python function)
requirements.txt               Flask
driveway-before-real.jpg       sample dirty driveway (replace per prospect)
driveway-after-real.jpg        sample clean driveway
pw-street-web.mp4 / _poster    pressure-washing hero/services motion
logo-bg.jpg                    Local Launch bottom image
README.md
```
