# HIGH batch 5 — H12 + H13 fix notes (2026-09-08)

Scope: `/mnt/d/LocalLaunch/dashboard` source only. No deploy, no worker scripts,
no live Blob / production data / credential changes. `tsc` + `next build` only.

Prior-batch uncommitted changes left untouched: `src/app/api/agent/approve/route.ts`,
`src/components/client-approval-panel.tsx`, `src/lib/revision.ts`, pipeline-store.

---

## H12 — stop using the short access code as a reusable credential

### New: `src/lib/session.ts`
HMAC-signed, expiring session tokens on Web Crypto (`crypto.subtle`) — runs on
both Edge and Node runtimes (Next 16 middleware is Node by default).

- `base64url(buf)` — URL-safe base64, no padding, no deps.
- `issueSession(secret, ttlMs = 30d)` → `"<expMs>.<sig>"`,
  `sig = base64url(HMAC-SHA256(key=secret, msg=String(expMs)))`. Returns `""`
  when `secret` is empty (fail closed).
- `verifySession(token, secret)` — splits on the **last** `.`, requires a
  numeric `expMs`, recomputes the HMAC, compares with a length-checked
  non-short-circuiting compare, then checks `Number(expMs) > Date.now()`.
  Returns `false` on any malformed input or empty secret.
- `isRequestAuthed(req)` — shared helper for API route handlers that double-gate
  behind middleware: accepts the signed `ll_dash_auth` cookie **or**
  `Authorization: Bearer <DASHBOARD_TOKEN>`. Fails closed with no token.

Secret is `process.env.DASHBOARD_TOKEN` throughout.

### `src/app/api/auth/login/route.ts`
- Still accepts the login code (`ACCESS_CODE` or `DASHBOARD_TOKEN`), but on
  success sets `ll_dash_auth` to `await issueSession(DASHBOARD_TOKEN)` — **never
  the raw code**.
- 503 when `DASHBOARD_TOKEN` is unset (it is the signing secret — fail closed
  even if `ACCESS_CODE` is present).
- In-memory rate limiter: module-level `Map<ip,{count,resetAt}>` keyed by the
  first `x-forwarded-for` value (fallback `"unknown"`); max 10 attempts / 10 min;
  429 `{error:"Too many attempts"}` on exceed.
- Cookie unchanged in shape: httpOnly, sameSite lax, secure on Vercel/prod,
  maxAge 30d, path `/`.

### `src/middleware.ts`
- Browser auth → `await verifySession(cookie, DASHBOARD_TOKEN)`.
- API auth → `Authorization: Bearer <DASHBOARD_TOKEN>` only.
- Raw `ACCESS_CODE` removed from `isAuthed` entirely (no longer accepted in
  cookie or bearer). `middleware` is now `async`.
- Fail-closed key is now `DASHBOARD_TOKEN` alone: 503 for `/api/*`, redirect to
  `/login` otherwise. Doc comment updated.
- Route paths, matcher, and public allowlist preserved (plus `/api/auth/logout`).

### New: `src/app/api/auth/logout/route.ts`
`POST` clears `ll_dash_auth` (`maxAge: 0`, same attributes) → `{ok:true}`.
Added to the middleware public allowlist.

### Collateral (required for H12 not to break these routes)
`src/app/api/pipeline/leads/route.ts`, `.../leads/delete/route.ts`,
`.../leads/[id]/route.ts`, `.../move/route.ts` each had a second in-route check
comparing the `ll_dash_auth` cookie **value** to the raw `ACCESS_CODE`. That
comparison would fail for every real user once the cookie holds a session token,
so each was switched to `await isRequestAuthed(req)` (same defense-in-depth,
compatible with the new cookie + machine bearer). No behavior change beyond the
credential format.

---

## H13 — centralize + secure relay/CRM endpoints (HTTPS or fail-closed)

### New: `src/lib/relay-config.ts`
- `getRelayUrl()` — reads/trims `SUPERVISOR_RELAY_URL`. Returns `null` if
  unset/empty, if malformed, or if it is plaintext `http://` on a non-loopback
  host. Allows `https://` anywhere or `http://` to `127.0.0.1` / `localhost` /
  `[::1]`. Trailing slash stripped.
- `getCrmBaseUrl()` — same policy over `CRM_ENDPOINT` (new) falling back to the
  existing `CRM_API_URL`.

### Hardcoded `http://137.184.135.50:9930` removed
All call sites now resolve `getRelayUrl()` and `fetch(\`${base}/chat\`)`. When it
returns `null` the relay call is **skipped** and the response reports
`relayed:false` + `relayError:"relay not configured (HTTPS required)"` (chat also
returns `connected:false`). Files:

- `src/app/api/agent/chat/route.ts` (POST + GET `?health=1`)
- `src/app/api/pipeline/approve/route.ts`
- `src/app/api/approve-combined/route.ts`
- `src/app/api/demos/route.ts`
- `src/app/api/pipeline/build-demo/route.ts` — **not in the literal task list**
  but carried the identical hardcoded fallback; fixed so no plaintext path
  survives (H09 idempotency logic untouched).

### `src/lib/crm-client.ts`
- Module-level `API_URL` (with the `http://137.184.135.50:3001` default) removed.
- `crmQuery` / `crmMutation` now call `getCrmBaseUrl()` first and return `null`
  (skip the call) when it is unset or plaintext-http-on-public-host.
- Header doc block updated to state HTTPS is required.

---

## Verification (run in order, from `dashboard/`)

1. `node node_modules/typescript/bin/tsc --noEmit --incremental false` → **exit 0**
2. `npm run build` → **exit 0** (middleware compiled as "Proxy (Middleware)")

## Legacy paths left

None. `grep -rn "137.184.135.50:9930|SUPERVISOR_RELAY_URL" src/` now only matches
the single read inside `src/lib/relay-config.ts`. No source file accepts the raw
`ACCESS_CODE` as a cookie/bearer credential anymore.

## Deploy / env follow-up (NOT done here)

- Set `SUPERVISOR_RELAY_URL` to an `https://` endpoint (or a loopback tunnel) in
  Vercel — until then every relay call fails closed and dashboard approvals will
  report `relayed:false`.
- Set `CRM_ENDPOINT` (or make `CRM_API_URL`) `https://` — CRM upserts are
  skipped until then.
- `DASHBOARD_TOKEN` must be set for login/session to work at all (already
  required today).
