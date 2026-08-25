# Auto Repair Template — Local Launch Demos

**Design source:** MasterTech Auto demo (`/mnt/d/LocalLaunch/demos/mastertech-auto/`) — the proven auto-repair demo structure.

**🎨 PALETTE IS LOCKED: LIGHT PROFESSIONAL** — off-white `#f4f3f0` bg, red accent `#e85d3a`, white cards with clean shadows, Inter font throughout. **NOT dark, NOT green, NOT warm-industrial** — the dark version was rejected twice by Zach for MasterTech; light/red rated 9/10. Do not change this.

**Structure:** Hero (full shop photo bg with dark overlay) → Pricing menu (4 white cards: oil change, tire rotation, brakes, diagnostic) → Divider (shop photo + "Quality Work. Fair Prices.") → Services (4 white icon cards) → About → CTA → Logo → CTA Text → Contact.

## How to Fork
```bash
mkdir -p /mnt/d/LocalLaunch/demos/<slug>
cp /mnt/d/LocalLaunch/templates/auto-repair/index.html /mnt/d/LocalLaunch/demos/<slug>/
cp /mnt/d/LocalLaunch/templates/auto-repair/deploy.py /mnt/d/LocalLaunch/demos/<slug>/
cp /mnt/d/LocalLaunch/templates/auto-repair/logo-bg.jpg /mnt/d/LocalLaunch/demos/<slug>/
```

## Placeholders to fill
`{{BUSINESS_NAME}}` · `{{CITY}}` · `{{PHONE}}` · `{{SLUG}}` · `{{OG_IMG}}` · `{{LOGO_IMG}}` (real logo extracted from their Facebook/website — see `local-launch-demo-assembly` references/auto-repair-demo-pattern.md for the extraction code)

## Hard Rules (inherited)
1. Real photos first; real reviews only; no raw hex outside `:root`; `overflow-x: clip`; roman headers; Hallmark stamp; mobile QA; OG tags; deploy as `<slug>-demo.vercel.app`.
2. **Keep the light/red palette.** It's the approved look for this vertical.
