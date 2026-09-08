# M06 — Wrong-type JSON bodies cause uncaught 500s instead of 400s

Date: 2026-09-08
Scope: Local Launch OS dashboard API routes. Source + build only — NOT deployed,
no worker scripts run, no live Blob / production data touched, no creds rotated.

## Problem

Every affected route wraps `await request.json()` in a try/catch, so malformed
JSON is handled. But a body that *parses* fine yet has the wrong shape —
`null`, a numeric `message`, an object-valued `feedback`/`reason`, `"true"` for a
boolean — slips past the catch and reaches destructuring / `.trim()` / gate
logic, where it throws **outside** the handler → an uncaught HTTP 500 with no
useful detail. TypeScript `as { ... }` assertions do nothing at runtime.

## Fix

### 1. New module: `src/lib/validate.ts`

Pure, dependency-free runtime predicates:

- `isObject(v)` — plain non-null object, not an array (type guard).
- `str(v)` — `typeof v === "string"`.
- `strMax(v, n)` — string with `v.length <= n`.
- `bool(v)` — strict `typeof v === "boolean"` (rejects `"true"`).
- `num(v)` — `typeof v === "number" && Number.isFinite(v)`.
- `optional(v, fn)` — `v == null || fn(v)`.
- `oneOf(v, list)` — membership test.
- `badField(body, schema)` — takes a plain-object body and a `{field: validator}`
  map; returns the first failing field name, or `null` if all pass. Bounded
  string validators are closures, e.g. `(v) => strMax(v, 4000)`.

### 2. Pre-validation added to each route (BEFORE destructuring)

Pattern, inserted right after the existing `request.json()` try/catch and before
any field is read:

```ts
if (!isObject(body)) {
  return NextResponse.json(
    { error: "Body must be a JSON object", field: "body" },
    { status: 400 },
  );
}
const bad = badField(body, { /* schema for the fields this route reads */ });
if (bad) {
  return NextResponse.json(
    { error: `Invalid or missing field: ${bad}`, field: bad },
    { status: 400 },
  );
}
```

All existing behaviour AFTER this point is unchanged — same destructuring, same
gates (auth, scope, revision H06, email MX, H11 persisted-field validation),
same mutations, same relay. Prior batches' checks (`if (!companyId || !action)`,
action/scope allow-lists, `VALID_PRIORITY` / `VALID_STAGES`, etc.) are left in
place; they are now redundant for shape but still enforce semantics.

| Route | Schema applied |
|---|---|
| `src/app/api/auth/login/route.ts` | `token: strMax(·,200)` |
| `src/app/api/approve-combined/route.ts` | `companyId: str`, `action: oneOf(approve/reject/rework)`, `reason`/`suggestedFix`: optional `strMax(·,4000)`, `forceSend`: optional `bool`, `scope`: optional `oneOf(demo/pitch/both)`, `expectedDemoUrl`/`expectedPitchHash`: optional `str` |
| `src/app/api/pipeline/build-demo/route.ts` | `companyId: str`, `notes`: optional `strMax(·,4000)` |
| `src/app/api/agent/chat/route.ts` | `message: str`, `clientId`: optional `str` (was the clearest 500: `body.message.trim()` on a number) |
| `src/app/api/fleet/dispatch/route.ts` | `agent: str`, `message: str` |
| `src/app/api/pipeline/leads/route.ts` | `name: strMax(·,4000)`, `category`/`location`/`phone`/`website`/`priority`/`stage`/`summary`: optional `strMax(·,4000)` |
| `src/app/api/email/verify/route.ts` (POST) | `email`: optional `strMax(·,320)`, `companyId`: optional `strMax(·,320)`. GET path uses query params, untouched. |
| `src/app/api/pipeline/leads/[id]/route.ts` (PATCH) | outer `isObject(body)` guard added; `fields` object check tightened from `typeof … === "object"` to `isObject` (also rejects arrays). H11 per-field value validation unchanged. |

### Notes on minor behaviour shifts (all 400 → 400 or 401/404-adjacent → 400)

- `auth/login`: a missing/blank `token` now returns `400 {field:"token"}`
  instead of `401 "Invalid code"`. Still a rejection; a *present* wrong code
  still returns 401.
- `pipeline/leads` POST: a missing `name` returns `400 {field:"name"}` instead
  of `400 "name is required"` — same status, structured field detail added.
- Response *shapes* for the success path and all existing error paths are
  otherwise preserved; only earlier, structured 400s were added.

## Routes intentionally left unvalidated

- `src/app/api/agent/approve/route.ts` — retired 2026-09-08 (H07). `POST()` /
  `GET()` take no request argument and read no body; every method returns
  `410 Gone`. Nothing to validate.

## Verification (run in order, from /mnt/d/LocalLaunch/dashboard)

1. `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **exit 0**
2. `npm run build` → **exit 0**

## Files changed

- `src/lib/validate.ts` — NEW.
- `src/app/api/auth/login/route.ts`
- `src/app/api/approve-combined/route.ts`
- `src/app/api/pipeline/build-demo/route.ts`
- `src/app/api/agent/chat/route.ts`
- `src/app/api/fleet/dispatch/route.ts`
- `src/app/api/pipeline/leads/route.ts`
- `src/app/api/email/verify/route.ts`
- `src/app/api/pipeline/leads/[id]/route.ts`

NOT deployed. Awaiting review.
