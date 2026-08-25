# Cleaning Template — Local Launch Demos

**Design source (2026-08-08):** the **Best Little Housekeepers demo** — the proven, user-approved cleaning quality bar. Live reference: `https://best-little-housekeepers-demo.vercel.app`. Structure = nav → **hero with full-bleed HD motion video** → why-us (4 cards, light) → services (gradient cards) → **reviews (sticky 100vh cleaning video behind white cards)** → about (split) → CTA → Local Launch bottom.

**Motion backgrounds (Palmetto-proven pattern):** hero video + poster (apartment cleaning) and reviews sticky video + poster (hands washing) — both from Pixabay CDN, shipped with this template: `cleaning-apartment-web.mp4`, `cleaning-hands-web.mp4` + posters. **Swap in prospect-specific clips when available** (same pattern as Palmetto). Compress ≤4MB (CRF 28, 1280w) or Vercel drops them. Reviews scrim is light (0.10/0.04/0.18) because the cards are white — headings sit on the cream cards, not the video.

**⚠️ COLOR RULE (Aug 2026):** use the demo's DESIGN, NOT its colors. Research the prospect's actual brand first (promo graphics, logo, uniforms, Facebook) and set the `:root` tokens to THEIR colors. Best Little = lavender `#9B7ED8` + pink `#E85C9B` + teal `#2FA9A0` (from their own promo graphic). Always override for the prospect.

**Palette tokens (in `:root`):** `--lavender` (primary) · `--lavender-deep` (nav/CTA) · `--teal` (secondary) · `--pink` (accent) · `--pink-light` · `--cream` (page bg)
**Fonts:** Playfair Display (headings) + Inter (body).

## When to Use
Any cleaning / maid / janitorial prospect that qualifies as NO-WEBSITE, PARKED, or SOCIAL-ONLY (see `local-business-prospecting` Phase 1.5).

## How to Fork (per prospect)

```bash
mkdir -p /mnt/d/LocalLaunch/demos/<slug>
cp -r /mnt/d/LocalLaunch/templates/cleaning/* /mnt/d/LocalLaunch/demos/<slug>/
```

Then edit `index.html`:
1. **Set `:root` tokens to the prospect's brand colors** (research first — see color rule above)
2. **Set `deploy.py` PROJECT** = `<slug>-demo`
3. **Keep or replace the motion videos** — template ships apartment/hands clips; if the prospect has own footage, compress to ≤4MB (CRF 28, 1280w) and swap filenames in the `<video>` + poster references
4. Replace every `{{PLACEHOLDER}}`:

| Placeholder | Meaning |
|---|---|
| `{{BUSINESS_NAME}}` / `{{CITY}}` | Legal/active brand name + primary service city |
| `{{PHONE}}` / `{{PHONE_LINK}}` | Display + `tel:` link format |
| `{{SLUG}}` | vercel slug (used in OG tags) |
| `{{ANCHOR_HUE}}` | brand hue description for the Hallmark stamp |
| `{{BRAND_IMG}}` | real promo/logo filename (from FB/their own materials) |
| `{{HERO_HEADLINE_1}}` / `{{HERO_ACCENT}}` | Headline + accent word |
| `{{HERO_SUB}}` | 1-2 line value prop |
| `{{PROOF_1..3}}` | Real proof: years, recommend %, insured/bonded |
| `{{WHY_LEDE}}` + why cards (4) | Trust signals — insured, reviews, reliability, scope |
| `{{SERVICES_LEDE}}` + service cards (4) | Real services: regular, deep, move-in/out, commercial |
| `{{REVIEWS_LEDE}}` + `{{REVIEW_1/2_TEXT/NAME/LOCATION/SOURCE}}` | REAL reviews only (Yelp/Google/FB) — never fabricate |
| `{{ABOUT_H2}}` / `{{ABOUT_P1/P2/HIGHLIGHT}}` | Owner story, years, service area |

## Proven Lessons (from Best Little build)
- **Real brand colors from their OWN promo graphic** — Best Little's lavender→teal gradient + pink came straight from their FB promo image ("When Your House Is A Mess, Call The Best Little Housekeepers in Town", since 1992, owner Tré Kirkland, phone). Fetch via logged-in FB profile + page-context fetch.
- **Phone conflict flag:** their own promo says (864) 494-7912 but Yelp shows 787-8311. Used their own graphic number (most authoritative) + flagged the discrepancy in the pitch for Zach to confirm. **Always surface conflicting numbers — never silently pick one.**
- **98% recommend (70+ reviews) is from their FB page** — real, verifiable. Yelp only had 2 reviews but both are real quotes (Linda P., Deborah W.) — used those.
- No domain anywhere (all variations NXDOMAIN — Claude Code verified) = total greenfield, no parked-domain angle; pitch leans on "3 decades of trust with nowhere to send people."

## Hard Rules (inherited from demo-assembly + Hallmark)
1. **Real photos first** — logo/promo + work shots from Facebook/Nextdoor/Instagram before AI. AI = fallback only.
2. **Real reviews only** — no fabricated testimonials ever. If <3 real reviews, use honest placeholder cards.
3. **No raw hex outside `:root`** — all colors via `var(--token)`.
4. **`overflow-x: clip`** on html AND body (never `hidden`).
5. **Roman headers only** — no italic headings (Hallmark gate 38a).
6. **Hallmark critique stamp** at top of `<style>` — update scores after each build.
7. **Mobile QA mandatory** — inject 375px viewport, check scrollWidth vs clientWidth on all text. See `walkthrough-demo-quality-gates` gate #10.
8. **OG tags required** before sending the link (title/description/image/url + twitter:card).
9. **Deploy as `<slug>-demo.vercel.app`** — edit `deploy.py` PROJECT constant first. Uses hardened deploy.py (env-token + upload_missing retry loop). After any video deploy, md5-verify the served file (stale CDN copies persist minutes).
10. **Demo + pitch to Zach before any prospect send** — never skip the approval gate.
