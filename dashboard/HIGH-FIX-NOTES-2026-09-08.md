# HIGH-severity fix batch — 2026-09-08

Scope: `/mnt/d/LocalLaunch/dashboard` only. Source edits + build verification.
No deploy, no worker runs, no live Blob / production-data mutation, no credential
rotation. The prior batch's work (pipeline-store.ts fail-closed reads /
useCache:false / commit-Blob-first, and the scripts/*.js ETag plumbing) was left
untouched.

---

## H16 — `scripts/send_pitch.py` shell injection (remote-exec risk)

**Was:** `send()` built one `cat {tmp} | himalaya template write ... -H "To:{email}"
-H "Subject:{subject}" ... | himalaya template send` string and ran it with
`shell=True`. Recipient + subject were interpolated straight into a shell command
(`$(...)`, backticks, `;`, `|` all reachable). Every send also overwrote the
shared world-readable path `/tmp/_pitch_send_body.txt`.

**Now:**
- `shell=True` removed entirely. Two `subprocess.run` calls with **argument
  arrays** (`["himalaya","template","write","-a","locallaunch","-H",f"To:{email}",
  ...]`), piped in Python: `write`'s stdout is fed to `send`'s stdin via `input=`.
  No data is ever interpolated into a command line.
- Body is streamed **in memory** over stdin — no `/tmp` file, shared or otherwise.
- Header-injection guard `_has_header_newline()` rejects CR/LF (raw *or*
  backslash-escaped `\r` / `\n`) in `--email` and `--subject`, both at
  arg-parse time in `main()` and again inside `send()`. A blocked send returns
  `rc=1` with a reason and never reaches the mailer.
- Existing `verify_email` MX/SMTP gate and the INVALID/UNKNOWN/`--strict` flow
  are unchanged.

## H15 — `src/app/api/demos/audit/route.ts` SSRF

**Was:** `auditOne()` did `fetch(url, { redirect: "follow" })` on the
company-editable `demoUrl` with no scheme/host policy, unlimited redirects, and
no body cap. A blocked/oversized URL could also 500 the whole route.

**Now:**
- `validateAuditUrl()` runs before any fetch: parses with `new URL()`, requires
  `https:`, and rejects private/loopback/link-local/metadata hosts via
  `isBlockedHost()` — `localhost`, `*.localhost`, `*.local`, `*.internal`,
  `metadata` / `metadata.google.internal`; IPv4 `0/8`, `127/8`, `10/8`,
  `172.16/12`, `192.168/16`, `169.254/16` (incl. `169.254.169.254`),
  `100.64/10`, `>=224/*`; IPv6 `::1`, `::`, `fe80::/10`, `fc00::/7`,
  IPv4-mapped `::ffff:`.
- `safeFetch()` uses `redirect: "manual"` and follows at most `MAX_REDIRECTS` (4)
  hops, **re-validating every `Location` against the same policy**. A blocked hop
  or a redirect loop → treated as "not fetchable".
- `readCappedText()` hard-caps the body at `MAX_BODY_BYTES` (512 KiB) and cancels
  the stream past the cap — enough for `<title>`, safe against a hostile stream.
- Blocked / unfetchable URLs return a clean `AuditEntry` (`status:"error"`, new
  optional `note` field with the reason) instead of throwing. The route still
  never 500s per-company.

## H11 — `src/app/api/pipeline/leads/[id]/route.ts` runtime value validation

**Was:** PATCH whitelisted *keys* but accepted any *value*. `priority:null`,
`name:{}`, `email:42`, `saleValue:"lots"` would persist and later crash
downstream `.toLowerCase()` / `.trim()` / arithmetic.

**Now:** `validateFieldValue()` checks every editable field before persisting:
- `priority` — must be one of `high | medium-high | medium | low`.
- `saleValue` — finite number `>= 0`, or explicit `null`.
- `name` — non-empty string, `<= 4000` chars (see note below).
- `category / location / phone / email / website / facebook / instagram /
  ownerName / offer / summary / responseStatus / demoUrl` — string `<= 4000`
  chars, or explicit `null` to clear.
- Any non-conforming value → `400 { error, field }` **before** `mutatePipeline`.
  Nothing is silently coerced.

## H04 — stage schema: accept `sale`, reject legacy `won` / `lost`

**Was:** `move/route.ts` and `leads/route.ts` allowlists were
`[... "build-launch", "won", "lost"]` — missing `sale` (which *is* in the
`StageId` union in `src/lib/data.ts`) and still accepting the dead `won`/`lost`.

**Now:** both allowlists are
`["prospect","audit","pitch","contacted","response","sale","build-launch"]`,
exactly matching the `StageId` union. `sale` is accepted; `won`/`lost` on a new
write get the existing `400 stage must be one of: ...`. **No migration** — any
existing record still carrying `won`/`lost` is left as-is; we only stop
accepting the values going forward.

## H09 — `src/app/api/pipeline/build-demo/route.ts` idempotency + client truth

**Was:** unconditionally set `demo.status = "build-requested"` (clobbering an
existing demo URL or an in-flight request), always returned `ok:true` even when
the Supervisor relay failed, and `client-build-demo.tsx` always rendered "the
agent is building…".

**Now:**
- Route: if the company already has a resolvable demo URL, or
  `demo.status === "build-requested"`, it returns a benign no-op
  (`ok:true, alreadyExists|alreadyRequested:true, relayed:false, message`) —
  checked both up front (from the `readPipelineSafe` snapshot) and again inside
  `mutatePipeline` under the atomic read (concurrent-request guard, sets
  `skipRelay`). No overwrite, no duplicate relay.
- Fresh requests still relay the work order and the response reports the real
  outcome: `{ ok:true, relayed, relayError }`.
- `client-build-demo.tsx`: new `relayFailed` state. When a *fresh* request comes
  back `relayed:false` (not `alreadyExists`/`alreadyRequested`), the card shows
  an amber "Queued — agent relay failed … Tap to retry" panel with a Retry
  button that re-POSTs, instead of falsely claiming the agent is building.

---

## Verification (run in order, all from `dashboard/`)

| # | Command | Result |
|---|---------|--------|
| 1 | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | **exit 0** |
| 2 | `npm run build` | **exit 0** (all routes compiled, 262+ SSG paths prerendered) |
| 3 | `python3 -m py_compile scripts/send_pitch.py` | **no syntax errors** (`node --check` N/A for a `.py` file) |

## Legacy paths left in place

None. `won`/`lost` are no longer accepted on writes; existing stored records are
intentionally not migrated per the task ("do NOT migrate existing records"),
which is a data decision, not a code legacy path.

## Files changed

Tracked (modified):
- `src/app/api/demos/audit/route.ts` — SSRF URL/host policy, manual re-validated
  redirects, body-size cap, clean not-fetchable result.
- `src/app/api/pipeline/leads/[id]/route.ts` — per-field runtime value schema,
  400 on non-conforming values before persist.
- `src/app/api/pipeline/leads/route.ts` — stage allowlist: `+sale`, `-won/-lost`.
- `src/app/api/pipeline/move/route.ts` — stage allowlist: `+sale`, `-won/-lost`.

Untracked (new files, edited in place — pre-existing `??` in git status):
- `scripts/send_pitch.py` — subprocess arg arrays, no `shell=True`, in-memory
  body, header-newline rejection.
- `src/app/api/pipeline/build-demo/route.ts` — idempotency guard + truthful
  `relayed` reporting.
- `src/components/client-build-demo.tsx` — relay-failure retry state.

Not touched: `src/lib/pipeline-store.ts`, `scripts/blob-watchdog.js`,
`scripts/collect-fleet.js`, `scripts/rebuild-worker.js`, and all other
pre-existing uncommitted work in the tree.
