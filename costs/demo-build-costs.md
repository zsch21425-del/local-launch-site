# Demo Build Cost Tracking

Purpose: turn the "~$0.25–0.50/demo" ballpark into a measured per-build number.
Fill one block per build. Cost code: SUB = subscription-covered (marginal $0),
METERED = real token spend.

## Price assumptions (ballpark)
| Component | Model | Rate | Billing |
|---|---|---|---|
| Research subagent | deepseek-v4-flash | ~$0.15/M in, $0.30/M out | METERED |
| Builder | claude haiku | $0.80/M in, $4/M out | SUB (OAuth) |
| Images | Grok grok-imagine-image (OAuth) | $0 | SUB (SuperGrok) |
| Vision/critic | gemini-2.5-flash | ~$0.15/M | SUB (credits) |
| Orchestration (me) | deepseek-v4-pro | ~$0.30–0.60/M | METERED |
| Deploy (Vercel) | — | $0 | free tier |
| Email send (himalaya/Gmail) | — | $0 | free |

## Metrics to capture per build
- Research: subagent model + wall-clock duration + output size (→ est tokens)
- Builder: turns used (claude -p log) — usually caps at 30
- Images: number of image_generate calls + upscales
- Vision: number of Gemini generateContent calls
- Orchestration: rough session context size (→ est tokens)

---

## Build log

### (next build — fill in)
- **Prospect:** 
- **Research:** model= , dur= , est_tokens= → **$**
- **Builder:** turns= → **$0 (sub)** / would-be $__
- **Images:** N= → **$0 (sub)** / would-be $__
- **Vision:** N= → **$0 (credits)**
- **Orchestration:** est_tokens= → **$**
- **TOTAL measured:** ~**$**


### 2026-08-19 — L And P Lawncare And Landscaping
- **Prospect:** L & P Lawncare (Spartanburg SC)
- **Research:** deepseek-v4-flash, 541s / 29 api calls → est $0.02–0.04
- **Builder:** claude haiku, 1 run (~30 turns, exit 0) → $0 (sub) / would-be ~$0.15
- **Images:** 6 × Grok grok-imagine-image (OAuth) → $0 (SuperGrok)
- **Vision:** 5 × Gemini 2.5-flash → $0 (credits)
- **Orchestration (me):** deepseek-v4-pro, long session → est $0.15–0.30
- **TOTAL measured:** ~**$0.20–0.35** (metered = DeepSeek only; builder/images/vision = subscription-covered)

### 2026-08-19 — Home Shield Roofing (ABORTED — rejected lead)
- Research 506s / 18 calls (~$0.02–0.04) — spent vetting before rejecting (BBB F + license alert + lawsuit). This is lead-vetting overhead, not a demo cost.
