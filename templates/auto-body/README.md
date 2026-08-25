# Auto Body Template — Local Launch Demos

**Design source:** Carolina Paint & Body demo (`/mnt/d/LocalLaunch/demos/carolina-paint-body/`) — the proven auto-body demo structure.

**🎨 PALETTE IS LOCKED: WARM INDUSTRIAL** — charcoal `#1B1A18`, copper `#D4845B`/`#E8A87C`, teal `#2CD4A9`, Space Grotesk headings + Inter body. Cinematic overlays (grain, scanlines, particles, aurora blobs), Lenis smooth scroll + GSAP reveals. This is the approved look for auto body — do not change.

**Structure:** Hero (3-col stats: years / rating / vehicles) → Services (5-card grid: Auto Body Repair, Painting, Collision Repair, Dent Removal, Detailing) → Why Us (4 trust-signal numbered cards) → Reviews (3 Google-style glass cards) → CTA (click-to-call) → Footer (compact NAP).

## How to Fork
```bash
mkdir -p /mnt/d/LocalLaunch/demos/<slug>
cp /mnt/d/LocalLaunch/templates/auto-body/index.html /mnt/d/LocalLaunch/demos/<slug>/
cp /mnt/d/LocalLaunch/templates/auto-body/deploy.py /mnt/d/LocalLaunch/demos/<slug>/
cp /mnt/d/LocalLaunch/templates/auto-body/logo-bg.jpg /mnt/d/LocalLaunch/demos/<slug>/
```

## Placeholders to fill
`{{BUSINESS_NAME}}` · `{{CITY}}` · `{{PHONE}}` · `{{SLUG}}` · `{{OG_IMG}}` + service/review images (real shop photos — see the demo's structure for which images go where)

## Hard Rules (inherited)
1. Real photos first; real reviews only (Google-style cards need REAL review text); no raw hex outside `:root`; `overflow-x: clip`; roman headers; Hallmark stamp; mobile QA; OG tags; deploy as `<slug>-demo.vercel.app`.
2. **Keep the warm-industrial palette** — it's the approved look for this vertical.
