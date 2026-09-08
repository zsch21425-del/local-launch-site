# HIGH-severity backend approval fixes — 2026-09-08

Scope: `/mnt/d/LocalLaunch/dashboard` approval backend only. Source edits + build
verification. **Not deployed. No worker scripts run. No live Blob / prod data /
credentials touched.**

Three verified HIGH issues (H07, H08, H10-backend).

---

## H07 — retire the legacy ungated approval endpoint

**File:** `src/app/api/agent/approve/route.ts`

**Was:** accepted `{clientId, action, feedback}` with no company lookup, no
persistent approval record, no pre-send email gate, and forwarded a free-text
"…then send the pitch to the client" instruction to the Supervisor relay. The
relay body also omitted `clientId` (sent `{message}` only).

**Now:** fail-closed deprecation shim. File kept (a caller may still hit the
path). `POST` and `GET` both return **HTTP 410 Gone** with
`{error: "…use /api/approve-combined … or /api/pipeline/approve …"}`. All
relay-forwarding logic removed; `RELAY_URL` constant deleted from the file.

---

## H08 — stop lying about relay delivery

**File:** `src/app/api/pipeline/approve/route.ts`

**Was:** `setTimeout(() => fetch(RELAY_URL …).catch(() => {}), 0)` for the
Supervisor relay and a second `setTimeout(…, 0)` for the CRM upsert, then
`return … { relayed: true }` unconditionally. On serverless the function can be
frozen/killed after the response is returned, so those timers may never run and
failures were swallowed regardless.

**Now:**
- Relay fetch is **awaited** with `AbortSignal.timeout(90000)`. Captures
  `relayed = res.ok` and `relayError = "relay HTTP <status>"` on non-2xx or the
  thrown error message (e.g. `"relay timeout"`) on failure.
- CRM upsert is **awaited** (only when `CRM_SESSION_TOKEN` is set). Reported
  separately as `crmRelayed` (boolean) and `crmError` (string, when it failed).
  `crmUpsertCompany` returns `string | null` and never throws, so `null` →
  `crmRelayed:false, crmError:"crm upsert returned null (unreachable or not
  persisted)"`. A CRM failure never fails the response.
- No `setTimeout` anywhere in the handler now.

**Response shape:** `{ ok:true, action:<status>, relayed, relayError,
crmRelayed?, crmError?, emailGate }` — `crmRelayed`/`crmError` keys are omitted
entirely when `CRM_SESSION_TOKEN` is unset. `action` still equals the requested
status; `emailGate` unchanged.

---

## H10-backend — honor the `scope` field

**File:** `src/app/api/approve-combined/route.ts`

The client (`client-approval-panel.tsx`, prior batch) now sends an explicit
`scope: "demo" | "pitch" | "both"` naming which artifact(s) a decision covers.
The backend ignored it and always mutated **both** pitch and demo, using
`hadPitch`/`hadDemo` captured from the pre-read — so "Approve demo" also
approved the pitch, and vice-versa.

**Now:**
1. `scope` is destructured from the body. Absent/undefined → `"both"`
   (backward compatible). Invalid value → 400. Derived `wantsPitch` /
   `wantsDemo` booleans.
2. `hadPitch` / `hadDemo` are computed **inside the mutation** from the fresh
   company AND gated by scope:
   `hadPitch = wantsPitch && !!c.pitchDraft`,
   `hadDemo = wantsDemo && !!(c.demoUrl || c.demo?.url)`.
   They are `let`s assigned in the mutator closure so an ETag-retry recomputes
   them against the winning read. The pitch-update block runs only when
   `hadPitch`; the demo-update block only when `hadDemo`. Out-of-scope artifact
   is left completely untouched.
3. The pre-read email gate now runs only when
   `action === "approve" && wantsPitch && preHadPitch` (pre-read used solely for
   the read-only MX check; the mutation re-reads atomically).
4. Relay decision message reflects only in-scope artifacts. New `scopeLabel`
   (`COMBINED` / `PITCH` / `DEMO` / `NO-OP`) drives the title:
   - approve: `COMBINED APPROVAL` | `PITCH APPROVED` | `DEMO APPROVED`
   - rework/reject: `PITCH REWORK`, `DEMO REJECTION`, `COMBINED REWORK`, …
   The `Pitch: zach-approved …` line is emitted only when `hadPitch`; the
   `Demo approved: <url>` line only when `hadDemo`. A demo-only approval no
   longer says anything about the pitch.
5. Response shape unchanged: `{ ok, action, hadPitch, hadDemo, relayed,
   relayError, emailGate }` — but `hadPitch`/`hadDemo` now report the scope
   actually processed (e.g. `hadPitch:false` for a `scope:"demo"` approval).

Relay call was already awaited in this file (prior batch) — left as-is.
Idempotent demo approval in `demos/route.ts` and the client panel changes were
**not** touched.

---

## Verification (run in order, from `dashboard/`)

1. `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **exit 0**
2. `npm run build` → **exit 0** (Next.js 16.3.0; all routes compiled, incl.
   `/api/pipeline/approve`, `/api/approve-combined`, `/api/agent/approve`)

## Legacy paths left

- The route `/api/agent/approve` itself is now a 410 shim — intentional, not a
  leftover.
- `src/components/pitch-review.tsx` still POSTs to `/api/agent/approve`. That is
  a **frontend** file, out of scope for this backend task. Behaviour is now
  fail-closed: the component's `try/catch` swallows the 410 and shows
  "approved" optimistically but **no pitch is sent and no record is mutated** —
  strictly safer than the old ungated send. Flagging for a follow-up frontend
  batch to repoint it at `/api/pipeline/approve`.
