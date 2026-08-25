# Plumbing Template — Local Launch Demos

**Design source (2026-08-08):** the **Royal Flush Plumbing demo** — the proven, user-approved plumbing quality bar. Live reference: `https://royal-flush-plumbing-demo.vercel.app`. Structure = nav (logo + CTA) → **hero with full-bleed HD motion video + real logo + proof row** → **services (sticky 100vh drain video behind translucent white cards)** → reviews (light, real quote + placeholders) → about (split) → CTA → Local Launch bottom.

**Motion backgrounds (Palmetto-proven pattern):** hero video + poster from Pixabay CDN (faucet drip), services sticky video + poster (water draining). Video files ship with this template: `plumbing-faucet-web.mp4`, `plumbing-drain-web.mp4` + posters. **Swap in industry/prospect-specific clips when available** (same pattern as Palmetto). Compress ≤4MB (CRF 28, 1280w) or Vercel drops them. Scrim over bright video must be heavy (0.55/0.40/0.65) so white headings read.

**⚠️ COLOR RULE (Aug 2026):** use the demo's DESIGN, NOT its colors. Research the prospect's actual brand first (logo colors, van wrap, uniform, Facebook page) and set the `:root` tokens to THEIR colors. Royal Flush = royal purple `#3B2360` + gold `#D4A437` (from their real logo). Default tokens are that purple/gold — always override for the prospect.

**Palette tokens (in `:root`):** `--royal` (primary dark) · `--royal-dark` (nav) · `--royal-deep` (page bg) · `--gold` (accent) · `--gold-light` · `--cream` (light section bg)
**Fonts:** Playfair Display (headings) + Inter (body).

## When to Use
Any plumbing / drain cleaning / water heater / septic prospect that qualifies as NO-WEBSITE, PARKED, or SOCIAL-ONLY (see `local-business-prospecting` Phase 1.5).

## How to Fork (per prospect)

```bash
mkdir -p /mnt/d/LocalLaunch/demos/<slug>
cp -r /mnt/d/LocalLaunch/templates/plumbing/* /mnt/d/LocalLaunch/demos/<slug>/
```

Then edit `index.html`:
1. **Set `:root` tokens to the prospect's brand colors** (research first — see color rule above)
2. **Set `deploy.py` PROJECT** = `<slug>-demo`
3. **Keep or replace the motion videos** — template ships faucet/drain clips; if the prospect has own footage, compress to ≤4MB (CRF 28, 1280w) and swap filenames in the `<video>` + poster references
4. Replace every `{{PLACEHOLDER}}`:

| Placeholder | Meaning |
|---|---|
| `{{BUSINESS_NAME}}` / `{{CITY}}` | Legal/active brand name + primary service city |
| `{{PHONE}}` / `{{PHONE_LINK}}` | Display + `tel:` link format |
| `{{SLUG}}` | vercel slug (used in OG tags) |
| `{{ANCHOR_HUE}}` | brand hue description for the Hallmark stamp |
| `{{LOGO_IMG}}` | real logo filename (prospect's actual logo from FB/website) |
| `{{HERO_HEADLINE_1}}` / `{{HERO_ACCENT}}` | Headline + accent word |
| `{{HERO_SUB}}` | 1-2 line value prop |
| `{{PROOF_1..3}}` | Real proof: years, 24/7, licensed/insured |
| `{{SERVICES_LEDE}}` + service cards (4) | Real services: plumbing repairs, drain cleaning, water heaters, emergency |
| `{{REVIEWS_LEDE}}` + `{{REVIEW_1_TEXT/NAME/SOURCE}}` | REAL review only (BBB/Yelp/Google) — never fabricate. Second card = honest placeholder |
| `{{ABOUT_H2}}` / `{{ABOUT_P1/P2/HIGHLIGHT}}` | Owner story, years, license, service area |

## Proven Lessons (from Royal Flush build)
- **Hero uses the prospect's REAL logo** (not a generated image) — Royal Flush's purple/gold crown-faucet logo became the whole palette. Fetch via logged-in FB profile + page-context fetch (CDN-403-proof).
- **Real review verification:** Royal Flush's "52 @ 4.9★" claim from a prior scan COULD NOT be reproduced (Claude Code flagged it). Reachable platforms showed 3.5★/3 (Yelp). Used the ONE verifiable BBB review (Julia B., real quote) + an honest placeholder. **Never repeat an unreproducible review count.**
- **Phone verification is non-negotiable:** (864) 601-9242 verified on 4+ sources (BBB, Yelp, Yahoo, scroyalflush.com). Emergency line (864) 601-0828 from FB. Flag any single-source number.
- **Parked owned domain = Tier-A prospect:** `scroyalflush.com` is a GoDaddy parking lander (`window.location.href="/lander"`) — the owner owns the domain, ready to point at the new build. Mention it in the pitch ("your domain is parked — I can make it live").
- Owner name from BBB (Kevin M. Baylson) → personalizes the pitch.
- Name-collision check: `royalflushplumbingllc.com` is a DIFFERENT Royal Flush (another state). Never assume a domain belongs to the prospect.

## Hard Rules (inherited from demo-assembly + Hallmark)
1. **Real photos first** — logo + work shots from Facebook/Nextdoor/Instagram before AI. AI = fallback only.
2. **Real reviews only** — no fabricated testimonials ever. If <3 real reviews, use honest placeholder cards.
3. **No raw hex outside `:root`** — all colors via `var(--token)`.
4. **`overflow-x: clip`** on html AND body (never `hidden`).
5. **Roman headers only** — no italic headings (Hallmark gate 38a).
6. **Hallmark critique stamp** at top of `<style>` — update scores after each build.
7. **Mobile QA mandatory** — inject 375px viewport, check scrollWidth vs clientWidth on all text. See `walkthrough-demo-quality-gates` gate #10.
8. **OG tags required** before sending the link (title/description/image/url + twitter:card).
9. **Deploy as `<slug>-demo.vercel.app`** — edit `deploy.py` PROJECT constant first. Uses hardened deploy.py (env-token + upload_missing retry loop).
10. **Demo + pitch to Zach before any prospect send** — never skip the approval gate.
