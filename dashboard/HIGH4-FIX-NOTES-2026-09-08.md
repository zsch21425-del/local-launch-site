# HIGH-4 / H06 — Revision binding on the approval flow

**Date:** 2026-09-08
**Scope:** ONE verified HIGH issue — approval routes could authorize the wrong or
unreviewed pitch/demo revision. No other changes.
**Status:** Source edited, `tsc` + `next build` clean. NOT deployed. No worker
scripts run, no Blob / production data touched, no credentials rotated.

---

## The bug (H06)

The client approval UI posted only `{companyId, action, scope}` — never *what*
the reviewer actually looked at. If the pitch body/subject or the demo URL
changed between the moment Zach reviewed and the moment he clicked Approve
(builder rework, a concurrent edit, a second device), the server happily
approved the **new** artifact. Zach's "approve" authorized content he never saw —
including, in the worst case, a pitch that would now fail the content gates or a
demo URL pointing somewhere else.

## The fix — 3 parts

### 1. `src/lib/revision.ts` (NEW)

`hashRevision(...parts: (string|undefined|null)[]): string`

- Joins parts with `"\u0000"` (NUL) so `["AB","C"]` and `["A","BC"]` never
  collide.
- FNV-1a, 32-bit, over UTF-16 code units (`charCodeAt`), `Math.imul` for the
  32-bit multiply → identical result in Node and the browser.
- Returns 8 lowercase hex chars.
- Pure arithmetic. No `crypto`, no `Date`, no `Buffer`/`atob`. Safe to import
  into a client component.

Sanity-checked at runtime: stable across calls, changes when subject/body
changes, always `^[0-9a-f]{8}$`, NUL separator prevents field-merge collisions,
`undefined`/`null`/no-args safe.

### 2. `src/components/client-approval-panel.tsx`

- `import { hashRevision } from "@/lib/revision";`
- In `act()`, after the action scope is resolved:
  - `expectedDemoUrl` = the `demoUrl` the panel actually displayed
    (`resolveDemoUrl(company)`), **only** when scope includes `demo`.
  - `expectedPitchHash` = `hashRevision(pitch?.subject, pitch?.body)`, **only**
    when scope includes `pitch`.
  - Both are `undefined` (and therefore dropped by `JSON.stringify`) for
    artifacts not in scope — no stale/empty values are sent.
- Added to the POST body alongside the existing fields. Route path
  (`/api/approve-combined`) and all existing fields unchanged.

Note: `resolveDemoUrl` is exactly `(company.demo?.url ?? company.demoUrl).trim()`,
which mirrors the server-side read below — so a legitimately unchanged demo never
trips the check.

### 3. `src/app/api/approve-combined/route.ts` + `src/app/api/pipeline/approve/route.ts`

- Both accept optional `expectedDemoUrl?: string` and `expectedPitchHash?: string`
  in the body (additive — nothing removed, response shapes preserved).
- The verification runs **inside the `mutatePipeline` mutator**, so it races
  against the atomic winning read (an ETag retry re-checks against the read that
  actually wins), not the earlier read-only pre-read.
  - `approve-combined`: if `expectedDemoUrl` is a non-empty string AND the demo
    is in scope (`hadDemo`) AND `((c.demo?.url ?? c.demoUrl) ?? "").trim() !==
    expectedDemoUrl.trim()` → `throw new Error("__REVISION_CONFLICT__")`.
    Same for `expectedPitchHash` vs `hashRevision(c.pitchDraft.subject,
    c.pitchDraft.body)` when `hadPitch`.
  - `pipeline/approve` is pitch-only: `expectedPitchHash` is verified against the
    live `c.pitchDraft`; `expectedDemoUrl` is accepted for a uniform client
    contract but the demo is never in scope on this route, so it is not verified
    here (`void expectedDemoUrl` documents the intent).
- `__REVISION_CONFLICT__` is caught in the route (same pattern as the existing
  `catch` around the mutation) and returned as:

  ```
  HTTP 409
  { "error": "The item changed since you reviewed it. Please re-review and resubmit.",
    "conflict": true }
  ```

- Demo URLs compared with `===` after `.trim()` on both sides; hashes compared
  with `===`.

## Interaction with prior batches (all preserved)

- `client-approval-panel.tsx` still sends `scope` and keeps demo/pitch state
  separate — revision fields are gated by that same scope.
- `demos/route.ts` idempotent demo, `pipeline/approve/route.ts` awaited relay +
  truthful `relayed`/`relayError`, `approve-combined/route.ts` honoring `scope`,
  `agent/approve/route.ts` 410 shim — none reverted or altered beyond the
  additive revision check in the two approval routes.

## Verification (run in order)

1. `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **exit 0**
2. `npm run build` → **exit 0** (full route table built, `/api/approve-combined`
   and `/api/pipeline/approve` compiled as dynamic functions)

## Legacy paths left

None. The revision fields are optional: an old client that doesn't send them
behaves exactly as before (no binding), and any client that does send them gets
the 409 guard. No deprecated code introduced or left behind.

## NOT done (out of scope / by constraint)

- No deploy, no Vercel Blob writes, no worker scripts, no production data
  mutation, no credential rotation.
- Panel UX for the 409: the existing `if (!res.ok || !json.ok)` branch surfaces
  `json.error` to the user as-is, which already reads correctly. No further UI
  work was in scope.
