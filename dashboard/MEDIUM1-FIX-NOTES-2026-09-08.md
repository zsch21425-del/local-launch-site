# MEDIUM batch 1 — 5 fixes (2026-09-08)

Scope: `/mnt/d/LocalLaunch/dashboard` source only. No deploy, no worker runs, no
Blob / production mutation, no credential rotation. Build verified locally.

All edits done in-session (no subagents). Prior-batch changes (pipeline-store
fail-closed/ETag, approval scope/revision/idempotency, HMAC session, relay
HTTPS, demos/audit SSRF block, client/[slug] live data) left intact.

---

## M03 — `src/lib/email-gate.ts` : Null MX + transient SERVFAIL misclassified

**Before:** any non-empty MX answer passed (incl. RFC 7505 null MX). `ESERVFAIL`
was folded into the "NXDOMAIN-ish → no MX" bucket and returned INVALID. Absence
of MX alone was treated as proof of invalidity. Positive wording implied mailbox
verification.

**After:**
- New `lookupMx()` returns a discriminated `MxLookup`: `mx | null-mx | no-mx |
  nxdomain | temporary`.
- **Null MX (RFC 7505):** single MX, preference 0, `.`/empty exchange (also: all
  exchanges are `.`) → `INVALID`, reason `"domain does not accept email (RFC
  7505 null MX)"`.
- **Temporary resolver failures** (`ESERVFAIL`, `ETIMEOUT/ETIMEDOUT`,
  `EREFUSED`, `ECONNREFUSED`, `ECONNRESET`, `ENETUNREACH`, `EHOSTUNREACH`,
  `EAI_AGAIN`, `EBADRESP`, and any unrecognised error) → `UNKNOWN` (retryable),
  reason names the code. No longer `INVALID`.
- **NXDOMAIN** (`ENOTFOUND`) → `INVALID` "domain does not exist" (proven).
- **No MX published** (`ENODATA` / empty): if the domain has an A/AAAA record →
  `UNKNOWN` ("implicit A/AAAA delivery possible but unverified", RFC 5321 §5.1);
  only if there is *also* no A/AAAA → `INVALID`. Invalidity is never proven from
  the absence of MX alone.
- **Positive wording relabelled:** `"domain checks passed (MX present) —
  recipient mailbox not verified"` / free-mail `"domain checks passed (mailbox
  not verified)"`. `EmailGateResult.ok` doc clarified it is a domain gate, not
  mailbox verification.
- `gateEmail` doc comment rewritten to describe the three states precisely.

Callers unchanged — `EmailGateStatus` / `EmailGateResult` / `ok` shape preserved,
so `approve/route.ts` (`INVALID` → block+bounce-risk, `UNKNOWN` → forceSend gate)
still behaves correctly and is now fed accurate classifications.

## M04 — clear stale bounce-risk when the recipient email changes

Three files:

- **`src/app/api/pipeline/leads/[id]/route.ts`** (PATCH mutator): when `email` is
  in the update set and the normalised value actually changed, `delete
  next.emailGate` and, unless the same request also set `responseStatus`, reset a
  `"bounce-risk"` `responseStatus` to `"unknown"`. `reviewFeedback` / `sendTruth`
  history untouched.
- **`src/app/api/pipeline/approve/route.ts`**: the stored gate already carries
  `emailGate.email` (bound to the exact address checked) — comment added. In the
  main atomic mutation, when a fresh gate **passes** (`emailGate.ok`) for an
  address different from the previously stored `priorGate.email` **and**
  `responseStatus === "bounce-risk"`, the obsolete flag is cleared to
  `"unknown"`. Only the stale flag is removed; historical evidence is preserved.
- **`src/lib/data.ts`**: new exported `activeEmailGate(company)` returns the
  stored `emailGate` only while its `email` still matches `companyEmail(company)`
  (else `null` = stale/ignored). `getWorkInbox` now reads gate status/email via
  `activeEmailGate` in all four spots (sendNow filter, bounceRisk filter, agent
  work item, bounceRisk item). A lingering `responseStatus:"bounce-risk"` still
  counts until a fresh passing gate clears it (write-side), so no genuine flag is
  silently dropped on read.

## M11 — `src/lib/a2a.ts` : JSON-RPC failures reported as success

**Before:** checked HTTP status only, then blindly read
`result.task.status.message.parts[0].text ?? ""` and returned `{ ok: true }` —
a JSON-RPC `error`, a failed task, or a missing body all became a successful
empty reply.

**After:**
- Body parsed defensively (non-JSON → failure).
- `d.error` present → `{ ok: false, error: "JSON-RPC error: …" }`.
- Missing `result` envelope → failure.
- `taskStatusError()` inspects `result.task.status.state` /`result.status.state`;
  any non-complete terminal state (fail/error/cancel/reject/unknown) → failure.
- `extractReplyText()` reads **both** envelope shapes and requires a non-empty
  string: `result.artifacts[0].parts[0].text` (worker `scripts/run-fleet.js`)
  **and** `result.task.status.message.parts[0].text`
  (`scripts/collect-fleet.js`). No text in either shape → failure, not empty
  success.
- Comment added stating both shapes must stay in sync with
  `scripts/run-fleet.js`; the worker is **not** modified in this batch.

`A2AReply` shape unchanged. Callers (`api/fleet/dispatch`, `api/fleet/tasks`)
already branch on `reply.ok` / `reply.error` — they now surface real failures
instead of blank "success".

## M15 — `src/lib/data.ts` + `src/components/revenue-tracker.tsx` : revenue drops on build-launch

- **`getRevenue()`**: now sums **both** closed stages via
  `CLIENT_STAGES` (`sale` **and** `build-launch`) instead of `sale` only. The
  bundled top-level `data.revenue` snapshot is used **only** when there are zero
  companies to derive from — it never overrides a live book. Doc comment
  rewritten: result is **booked / stage-derived**, not paid / MRR truth.
- `CLIENT_STAGES` (data.ts ~319) already contained both stages — referenced
  directly now.
- **`RevenueTracker`**: per-client breakdown switched from `stage === "sale"` to
  `CLIENT_STAGES` **and** filtered to clients that actually carry a `revenue`
  block (so the totals and the list agree, and we never render invented rows).
  Copy relabelled: "Booked from closed clients (Sale + Build & Launch) —
  stage-derived, not billed", badge "{n} closed", empty state reworded.
- `src/app/reports/page.tsx` already passes the live `companies` list to
  `getRevenue` — no change needed there beyond the derivation fix above.

## M18 — `src/app/api/demos/audit/route.ts` : unknown identity marked "ok"

**Before:** `titleMatchesName` returned `true` (→ `status:"ok"`) when the page
title or company name normalised to empty, and an empty `core` matched every
title via `t.includes("")`. A bare boolean with no "unknown" state.

**After:**
- `titleMatchesName` → `checkTitleIdentity()` returning
  `"verified" | "mismatch" | "unknown"`.
- Requires a non-empty, ≥3-char identity token on **both** sides
  (`t.length >= 3 && core.length >= 3`) before it can return `verified` /
  `mismatch`; otherwise `unknown`. Kills the `includes("")` match.
- `AuditEntry.status` gains `"unknown"`; `auditOne` returns it with a
  `needs-review` note (distinguishes "no `<title>`" from "title has no usable
  token"). `verified → ok`, `mismatch → wrong-business`.
- `summary` gains `needsReview` count (existing keys preserved).
- Comment: the title heuristic is **triage, not a send-authorization gate**.

No frontend consumer of `/api/demos/audit` JSON found; adding the status value is
backwards-safe.

---

## Verification

1. `node node_modules/typescript/bin/tsc --noEmit --incremental false` → exit 0 ✅
2. `npm run build` → exit 0 ✅ (all routes compiled; `/api/demos/audit`,
   `/api/pipeline/leads/[id]`, `/api/pipeline/approve`, `/reports` all built)

## Legacy paths left

None. `data.revenue` fallback in `getRevenue` is retained deliberately (only
reachable with an empty companies list) and is documented as a fallback, not an
override.
