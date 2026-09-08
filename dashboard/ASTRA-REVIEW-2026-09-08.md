# LLOS systematic code review — 2026-09-08

## Summary

**3 CRITICAL · 16 HIGH · 18 MEDIUM · 6 LOW.** Build and TypeScript pass; lint does not. The most urgent issue is unsafe full-book replacement by background and recovery writers, despite CAS-protected API routes.

## Scope and verification

Reviewed the working tree at `/mnt/d/LocalLaunch/dashboard`, including existing modified and untracked source files—not merely committed HEAD. The live book is the flat Vercel Blob `pipeline.json`; the bundled JSON is a build snapshot. No application fixes, production mutations, sends, deployments, credential rotations, or worker executions were performed.

Actual checks:

- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: **PASS**, exit 0, empty diagnostic log.
- `npm run build`: **PASS**, exit 0, Next.js 16.3.0 / Turbopack. It prerendered client workstations from the bundled book. Build log: `/tmp/llos-build-review.log`.
- `node node_modules/eslint/bin/eslint.js src --format json`: **FAIL**, 113 errors and 11 warnings across 93 linted files. Results: `/tmp/llos-eslint-review.json`.
- Source searches covered `TODO`, `FIXME`, `HACK`, `@ts-ignore`, `as unknown as`, `console.log`, and word-boundary `any` in `src/` and `scripts/`.
- Findings below are source-proven defects or explicitly scoped risks. Concurrency scenarios are code-path analysis, not destructive experiments on the live book. Deployment environment overrides, firewall rules, remote agent behavior and remote database policy were not asserted from local source alone.

Severity: **CRITICAL** = whole-book loss/corruption; **HIGH** = broken core workflow, unsafe approval, consequential security or persistence issue; **MEDIUM** = operational inconsistency, reliability or bounded security issue; **LOW** = maintainability/accessibility/polish.

## CRITICAL

### C01 — Background writers bypass concurrency and overwrite the entire live book

**Evidence:** `scripts/collect-fleet.js:228-237`; `scripts/run-fleet.js:50-55,78-109`; `scripts/rebuild-worker.js:67-72,293,400-401`.

The routes mostly use `mutatePipeline`, but these workers call unconditional `put(...allowOverwrite:true)` on a full book. `run-fleet` retains its initial book through multiple agent calls; `rebuild-worker` retains it through a potentially long build/deploy. A dashboard approval or a Supervisor's newly added lead during that interval is overwritten by the next worker save. A worker-local lock does not protect other writers. This can even erase the leads created by the fan-out itself.

**Fix:** Route every writer through a shared origin-read/ETag mutation API. Commit only the worker-owned field changes against the latest book, outside long-running work. Separate fleet telemetry and job logs from the company book. Remove unrestricted full-book writer exports except an explicitly guarded recovery tool. Audit the additional maintenance writers listed in the coverage appendix before re-enabling them.

### C02 — Blob read failure silently becomes an unconditional local-snapshot overwrite

**Evidence:** `src/lib/pipeline-store.ts:44-62,99-106,139-145`.

With a Blob token present, any read failure—including transient network failure or malformed JSON—is swallowed. Locally the store returns the bundled/local file with `etag:null`; a subsequent mutation calls Blob `put` without `ifMatch`. If the write succeeds after the read failed, stale local data replaces the live book. Merely using `mutatePipeline` does not make this failure path safe.

**Fix:** When Blob is configured, fail closed on an unreadable Blob or missing ETag. Make local-only storage an explicit separate mode, never a fallback authority. Require a valid ETag for all normal Blob updates and validate the root schema before invoking the mutator.

### C03 — Watchdog “heals” any read error by restoring a stale book; backups are not live backups

**Evidence:** `scripts/blob-watchdog.js:26-34,46-47,63-84`.

`blobCompanies` starts at `-1`; a non-404 read error leaves it there. The `=== -1` recovery branch uploads local JSON unconditionally. An availability blip is therefore treated as permission to restore data. The backup path copies the local file, not a successfully read live snapshot, so the dated backup may already lack hosted approvals.

**Fix:** On transient read errors, alert/retry without writing. Recover only from an explicitly confirmed missing/corrupt store and a validated, versioned live backup under a recovery lock/conditional create. Back up the successfully read live book with timestamp and ETag, and verify the restored counts and fields before claiming recovery.

## HIGH

### H01 — Client workstation and activity read the frozen build snapshot

**Evidence:** `src/app/client/[slug]/page.tsx:5-20`; `src/lib/data.ts:1,187,223-234`; `src/app/api/client/activity/route.ts:15-38`; `src/app/api/client/file/route.ts:17-18`.

Lists use live Blob data, but the actual decision workstation calls `getCompany` on imported JSON and uses `generateStaticParams`. New live leads can appear in lists yet 404 in their workstation; edited contact details, new demos and approvals remain stale after refresh. Activity uses the same snapshot. `router.refresh()` alone cannot repair an accessor that never reads Blob.

**Fix:** Render `/client/[slug]` dynamically from the live store, or fetch a live company endpoint through a shared query cache. Revalidate/refetch after mutations; resolve missing companies against live data. Keep only non-sensitive static defaults/types in the bundled accessor module. Derive activity from live state and real events.

### H02 — ETag retries read cached data instead of the latest origin version

**Evidence:** `src/lib/pipeline-store.ts:48,139-149`; installed SDK contract `node_modules/@vercel/blob/dist/index.d.ts:139-145`.

Blob `get` defaults to CDN cache; its documented `useCache:false` option guarantees latest origin content. Five immediate retries can repeatedly receive the same stale ETag, exhausting the retry budget after a valid preceding write. Cached GETs also make successful edits appear to revert.

**Fix:** Use `get(...,{access:"private",token,useCache:false})` for mutation reads and read-after-write verification. Add bounded jitter/backoff on conflicts. Return the committed result from the mutation rather than immediately rereading a cached book. Do not weaken the conditional write to make a retry succeed.

### H03 — Local writes happen before Blob commit, and failed Blob writes return success

**Evidence:** `src/lib/pipeline-store.ts:89-96,109-117`.

The local mirror is written before conditional Blob persistence. A CAS conflict or failed remote write leaves the local book ahead of or different from the authoritative book; non-conflict Blob failures explicitly return `ok:true` locally. Callers may then relay an approval that was never committed to the live book. This also contaminates the watchdog's recovery source.

**Fix:** Commit Blob first, report failure if the authoritative commit fails, then atomically update the local mirror with the committed data. Report mirror-sync failure separately. For explicit filesystem-only mode, use a process-safe lock and temp-file/rename rather than an unprotected whole-file overwrite.

### H04 — The canonical Sale stage is rejected; non-canonical won/lost are accepted

**Evidence:** `src/app/api/pipeline/move/route.ts:10,26`; `src/app/api/pipeline/leads/route.ts:11,55`; `src/lib/data.ts:7-14,189-196,312-325`.

The UI/type model includes `sale`, but both write-route allowlists exclude it and accept `won`/`lost`. Moving a lead into Sale fails. Records written with the accepted legacy values fall outside the canonical lead/client partitions and may disappear from useful views.

**Fix:** Export one runtime stage schema and reuse it in routes, types, selectors and controls. Support `sale`; reject legacy values on new writes. Migrate existing legacy records with an explicit business mapping, not a guessed automatic conversion.

### H05 — Approving a demo fabricates outreach progress and is not idempotent

**Evidence:** `src/app/api/demos/route.ts:119-142`; compare `src/app/api/approve-combined/route.ts:131-149`.

Every demo approval increments the current stage. A `pitch` lead becomes `contacted` without an email send; another request can move it to `response`, then `build-launch`, bypassing Sale entirely. Duplicate delivery or repeated clicks therefore change business facts. The combined approval route does not advance the stage, so the result also depends on which UI Zach uses. The demo route accepts approval without a real demo URL and invents a relay URL fallback.

**Fix:** Demo approval should update only a versioned demo decision. Require an explicit verified URL. Advance outreach/sale stages only when the corresponding send, response or sale event is recorded. Make repeated approval of the same revision an idempotent no-op.

### H06 — Approval routes can authorize the wrong or unreviewed pitch revision

**Evidence:** `src/app/api/pipeline/approve/route.ts:53-79,114-118,141-151`; `src/app/api/approve-combined/route.ts:48-75,109-119,181-190`; `src/app/client/[slug]/page.tsx:17`.

The UI sends only company ID and decision, not the revision Zach reviewed. The server pre-reads an email/draft, performs DNS work, then approves whatever draft exists in a later mutation. Concurrent changes to recipient/body/demo are not compared. In the combined route, even `hadPitch` and `hadDemo` come from the old read. Blob CAS prevents a lost write; it does not guarantee approval of the reviewed artifact.

**Fix:** Submit expected pitch/demo revision or content hash, recipient and action scope. Verify these inside the mutation and return 409 if changed; require re-review. Bind the email gate to the exact recipient. An outbox worker must recheck the approved revision before sending.

### H07 — Send authorization is not a single enforced server-side gate

**Evidence:** `src/app/api/agent/approve/route.ts:18-33`; `src/app/api/pipeline/approve/route.ts:59-79,118,141-151`; `src/app/api/approve-combined/route.ts:55-75,116-119`.

The legacy agent approval route issues “send the pitch” with no company lookup, persistent approval or email gate. The pipeline route treats `supervisor-approved` and `zach-approved` identically in its send work order, and allows `sent` to be written directly without send evidence. A truthy empty/status-only `pitchDraft` also passes the existence check. No shared handler enforces nonempty reviewed body, required demo readiness, send evidence and approval scope. Remote worker safeguards may exist, but these endpoints do not enforce them.

**Fix:** Retire `/api/agent/approve` or delegate it to the same typed approval command. Separate supervisor review, final approval and confirmed send events. Require a real draft and tier-appropriate approved/live demo, reject unsupported transitions, and reserve `sent` for verified sender callbacks with message IDs.

### H08 — Pitch approval claims relay success without waiting for delivery

**Evidence:** `src/app/api/pipeline/approve/route.ts:159-166,184`; CRM variants at `168-181` and `src/app/api/demos/route.ts:235-247`.

The API schedules `setTimeout` work and immediately returns `relayed:true`. Serverless execution may stop after responding; errors are swallowed and non-2xx relay responses are not checked. Zach can see a successful approval while the work order was never accepted.

**Fix:** Persist a work-order/outbox entry atomically with the decision and have a retrying worker deliver it. Return `queued`, `delivered` or `failed` truthfully. Awaiting a bounded relay request is a minimum patch; `after()` alone is not a durable queue. Apply the same treatment to CRM synchronization.

### H09 — Build-demo requests can remain stuck forever and overwrite existing demo status

**Evidence:** `src/app/api/pipeline/build-demo/route.ts:29-43,69-84`; `src/components/client-build-demo.tsx:35-40,48-59`; `scripts/rebuild-worker.js:295-300`.

The route unconditionally sets `build-requested`, even if a demo already exists or the same build was requested previously. Relay failure still returns `ok:true`. The client ignores `relayed` and announces that the agent is building. The local rebuild worker only polls `rework`/`rejected`, not `build-requested`, so it does not recover this particular lost delivery.

**Fix:** Validate demo eligibility and deduplicate a versioned build command inside `mutatePipeline`. Persist delivery/retry state in a durable outbox, display queued versus running versus failed, and provide a safe retry. Preserve completed demo decisions unless a new explicit rebuild command is issued. Record the actual deployment URL rather than instructing a guessed naming convention.

### H10 — Mixed demo/pitch decisions are incorrectly collapsed into “Approved”

**Evidence:** `src/components/client-approval-panel.tsx:33-42,121-129,248-259,359-363`.

If either demo is approved or pitch is approved/sent, `storedResult` becomes approved for the entire panel. An approved demo plus pending/rejected pitch hides the remaining approval controls and says “agent can proceed (send / next steps).” This is independent of the frozen-page problem.

**Fix:** Track demo and pitch decisions separately. Only call the combined state approved when every included artifact is approved; treat `sent` as a separate terminal send event. Render actions for the pending artifact and send explicit action scope to the backend. Synchronize local decision state when record revisions change.

### H11 — Lead PATCH validates keys but accepts values that crash the dashboard

**Evidence:** `src/app/api/pipeline/leads/[id]/route.ts:47-56,75`; `src/lib/stages.ts:179-190`; `src/lib/data.ts:379-380,458-460,904-906`.

Allowed values are arbitrary JSON. For example, a valid authenticated PATCH can persist `priority:null`, `name:{}`, or `email:42`; consumers then call `.toLowerCase()`, `.replace()` or `.trim()` and fail. This is a durable corruption path, not just a malformed-request 500. Whole-company data from workers is likewise not schema-validated at the store boundary.

**Fix:** Add runtime schemas for every editable field: bounded strings, nullable fields explicitly defined, finite nonnegative monetary values, priority enums, and URL/email validation. Validate and normalize companies on ingestion; reject invalid writes before persistence. Use `unknown` plus parsing instead of `any` for store/API boundaries.

### H12 — Short access code is directly usable as an unrestricted bearer/cookie credential

**Evidence:** `src/app/api/auth/login/route.ts:22-35`; `src/middleware.ts:29-38`; `src/app/login/page.tsx:65-67`.

The app advertises a four-digit code, stores that same reusable secret in the cookie, and accepts it directly on every protected request. There is no application rate limiting or session issuance. Throttling only `/api/auth/login` would still leave the direct cookie/bearer route available for guessing. External WAF protections were not verified.

**Fix:** Use a strong machine token only for API automation and an opaque, revocable high-entropy session for browsers. Rate-limit login and enforce abuse controls on authentication at the boundary. Add logout/revocation. Keep the existing fail-closed behavior when auth is unconfigured.

### H13 — Sensitive relay traffic uses plaintext HTTP and inconsistent endpoint configuration

**Evidence:** `src/app/api/agent/chat/route.ts:4,52-56`; `src/app/api/agent/approve/route.ts:3,25-29`; `src/app/api/approve-combined/route.ts:8,199-203`; `src/lib/crm-client.ts:17,34-35,53-59`.

Chat and legacy approval hardcode a public-IP HTTP relay while newer routes honor `SUPERVISOR_RELAY_URL`. The defaults send contact details, draft bodies and work orders over plaintext; the CRM default sends a signed session cookie over HTTP. The `__Secure-` cookie name does not protect a server-constructed HTTP header. Actual env overrides may mitigate some paths, but cannot override the hardcoded chat URL.

**Fix:** Centralize relay/CRM configuration, require HTTPS or an authenticated private tunnel in production, fail closed without required config, and authenticate service requests. Do not expose reusable credentials or client messages to plaintext transport.

### H14 — Checked-in workers contain reusable credentials; standalone relay has no incoming authentication

**Evidence:** `scripts/run-fleet.js:18,65-67`; `scripts/agent-processor.js:10-13`; `scripts/relay.py:27-44,60-64,70-81`.

An agent token and a database-owner connection string/password are hardcoded in source (not reproduced here). The legacy processor also disables TLS certificate verification. The standalone relay binds `0.0.0.0`, accepts `/chat` and `/pipeline` without validating incoming auth, and supplies an upstream credential itself. If this script is deployed on a reachable interface, callers can bypass dashboard authentication. This local script's deployment is not assumed to be the same service as the hosted port-9930 relay.

**Fix:** Rotate both embedded credentials, load them from managed secrets, remove them from tracked history as appropriate, and add secret scanning. Require verified database TLS and a least-privilege worker role. Bind the relay to loopback/private networking and require incoming service authentication, request limits and an allowlist. Verify the actually deployed relay has equivalent controls before claiming the issue resolved.

### H15 — Demo audit performs SSRF-capable fetches from editable URLs

**Evidence:** `src/app/api/pipeline/leads/[id]/route.ts:29,55-56`; `src/app/api/demos/audit/route.ts:6-10,67-78`.

An authenticated editor can set `demoUrl` to an internal HTTP endpoint. Audit then fetches it server-side with unrestricted redirect following and returns HTTP/title information. There is no scheme/host/IP policy or response-size cap. Authentication reduces exposure but does not make stored URLs trustworthy; automated lead ingestion is another source.

**Fix:** Require HTTPS and approved deployment hosts where practical. Otherwise resolve and reject loopback/private/link-local addresses, validate every redirect hop and guard against rebinding. Bound response bytes and overall audit workload; do not treat a URL string as a trusted fetch target.

### H16 — Send helper interpolates draft text into a shell and shares a body file across sends

**Evidence:** `scripts/send_pitch.py:21-32,47-64`; callers prescribe this helper in `src/app/api/pipeline/approve/route.ts:145` and `src/app/api/approve-combined/route.ts:187`.

Recipient and subject are interpolated into a double-quoted shell command with `shell=True`. A subject containing shell substitution such as `$()` or a quote can execute shell syntax instead of remaining email data; a valid domain check does not sanitize the subject. Every invocation also overwrites the same `/tmp/_pitch_send_body.txt`, so concurrent sends can use another company's body. The helper itself verifies only an email/domain, not the company approval revision, and defaults to allowing UNKNOWN unless `--strict` is supplied.

**Fix:** Invoke Himalaya using argument arrays and explicit stdin, with no shell interpolation. Keep message bodies in memory or use securely created per-send temporary files. Require a versioned approved outbox item, block inconclusive verification by default, validate header newlines, and verify the resulting message in the correct Sent folder before recording a send. Do not execute a proof payload or send test emails against production.

## MEDIUM

### M01 — Legacy pitch statuses are still written, and resubmission erases feedback before revision

**Evidence:** `src/app/api/pipeline/approve/route.ts:26-42,118-126`; `src/app/approvals/page.tsx:167-177`; `src/lib/data.ts:81-90,518-521,592-597`.

The route accepts `pending` and `conditional`, rejects canonical `pending-review`/`pending-supervisor-review`/`rework`, and the UI resubmits as `pending`. Resubmission deletes the rejection feedback without changing the body; it does not queue the specific revision work order. Separately, the agent-work selector includes rejected pitches but omits canonical `rework`, hiding work assigned through combined approval.

**Fix:** Use one pitch state machine and runtime enum everywhere. A rework request must retain revision feedback until a new draft is submitted; emit a durable revision task. Include `rework` in the agent work queue. Migrate existing legacy values explicitly.

### M02 — A status-only pitch hides the Build Demo control and can block demo-only approval

**Evidence:** `src/components/client-workstation.tsx:79,104-111`; `src/components/client-approval-panel.tsx:20-23`; `src/app/api/approve-combined/route.ts:55,64-72`.

`pitchDraft:{status:"pending-review"}` is truthy even without a body. It takes priority over the no-demo build state. Combined approval also treats it as a pitch and requires an email, preventing independent approval of an existing demo when there is no actual pitch to send.

**Fix:** Define `hasReviewablePitch` using a valid nonblank body. Render demo-build eligibility independently of pitch presence. Give demo-only and pitch-only decisions their own scopes and validation.

### M03 — Email gate treats Null MX as valid and transient SERVFAIL as a dead domain

**Evidence:** `src/lib/email-gate.ts:52-66,116-144`.

Any nonempty MX answer is accepted, including a Null MX record indicating the domain does not accept mail. `ESERVFAIL` is treated as `no MX` and subsequently becomes `INVALID`, although it can be temporary. The `ok` comment also overstates mailbox deliverability: neither an MX record nor a free-mail domain proves the recipient exists.

**Fix:** Detect Null MX explicitly; classify temporary resolver failures/timeouts as `UNKNOWN`; distinguish a strict no-MX policy from proven invalidity (implicit A/AAAA mail delivery can exist). Label the result “domain checks passed,” not mailbox verified, and impose bounded DNS timeouts. Preserve explicit final-send safeguards.

### M04 — Fixing an email does not clear the stale bounce-risk gate

**Evidence:** `src/app/api/pipeline/leads/[id]/route.ts:75`; `src/app/api/pipeline/approve/route.ts:84-86,117`; `src/lib/data.ts:501-515`.

Editing an email preserves `emailGate` and `responseStatus:"bounce-risk"`. Even a later valid gate does not clear that response flag. The command board therefore continues to list the corrected company as bounce risk and excludes it from send-ready work.

**Fix:** Invalidate email verification whenever the recipient changes. Bind gate records to the exact email; when a fresh gate passes, remove only the obsolete bounce-risk flag associated with that recipient. Preserve actual historical bounce evidence separately.

### M05 — Bearer authentication works in middleware but fails on lead/move routes

**Evidence:** `src/middleware.ts:33-38`; `src/app/api/pipeline/leads/route.ts:4-8,30`; `src/app/api/pipeline/leads/[id]/route.ts:4-8,43`; `src/app/api/pipeline/leads/delete/route.ts:5-12`; `src/app/api/pipeline/move/route.ts:4-8,19`.

These routes recheck only the short-code cookie. A valid `Authorization: Bearer <DASHBOARD_TOKEN>` passes middleware and still receives 401. A long-token cookie can also fail when `ACCESS_CODE` is configured.

**Fix:** Share one fail-closed authorization helper and clearly distinguish browser versus automation permissions. Do not silently narrow the accepted authentication contract in individual routes.

### M06 — Valid JSON with wrong types causes uncaught 500s instead of useful validation errors

**Evidence:** `src/app/api/auth/login/route.ts:22`; `src/app/api/approve-combined/route.ts:23,37,45-46`; `src/app/api/pipeline/build-demo/route.ts:21,27`; `src/app/api/agent/chat/route.ts:13`; `src/app/api/agent/approve/route.ts:12`; `src/app/api/fleet/dispatch/route.ts:21-22`; `src/app/api/pipeline/leads/route.ts:33-49`; `src/app/api/email/verify/route.ts:41-42`.

JSON parsing is caught, but `null` bodies, numeric messages and object feedback fields survive until destructuring or `.trim()` throws outside the error handler. TypeScript assertions do not validate runtime JSON.

**Fix:** Parse every body with a strict runtime schema before destructuring. Require object bodies, bounded strings and real booleans (`forceSend:true`, not a truthy string). Return structured 400 errors with field details. This complements the persisted-data validation in H11.

### M07 — Single approval failures are swallowed in the main approval page

**Evidence:** `src/app/approvals/page.tsx:132-145,167-180`.

A blocked email, missing recipient, store conflict or network failure leaves the Approve button apparently doing nothing. The route already provides an explanatory error, but the UI discards it. Resubmit behaves similarly.

**Fix:** Check both HTTP status and response `ok`, render the server error inline with retry, keep feedback forms open on failure, and refresh the exact company after success. Show queued/delivered status rather than merely removing a card.

### M08 — Checklist completion is browser-local rather than shared operational state

**Evidence:** `src/components/playbook-checklist.tsx:18-24,35-54,66-68`; `src/lib/data.ts:748-754`.

Checking an item only writes localStorage. Other devices, agents and reports still see the original `done` value. Overrides also mask later authoritative changes, and switching company IDs does not clear old overrides when the new key is absent.

**Fix:** Persist item-level changes through a typed `mutatePipeline` route; use local state only optimistically. Reconcile revisions on success, surface failures, and reset state on company change. If private scratch checklists are intentional, label them clearly and keep them separate from shared completion metrics.

### M09 — Empty books cannot be initialized through the app, even though the final lead can be deleted

**Evidence:** `src/app/api/pipeline/leads/delete/route.ts:20-24`; `src/app/api/pipeline/leads/route.ts:95-96`; `src/app/api/pipeline/data/route.ts:21-25`; `src/hooks/use-pipeline.ts:35-37`.

Deletion can remove the final company, but the read endpoint and create endpoint treat a valid empty array as an unreadable store. A legitimate empty book becomes a dead end that requires out-of-band reseeding.

**Fix:** Distinguish missing/unreadable storage from a valid `{companies:[]}` book. Permit adding the first lead and show a proper zero state. Prefer soft deletion/archive with an undo path and audit trail over irreversible removal.

### M10 — CRM errors are displayed as connected; upsert can duplicate or falsely report success

**Evidence:** `src/lib/crm-client.ts:29-42,89-91,108-137`; `src/app/api/pipeline/data/route.ts:36-42`.

CRM helpers swallow failures and return null/empty lists, so the API sets `crmConnected:true` even when credentials are incomplete or the CRM is down. Upsert looks only at the first 200 companies despite the larger book, treats failed lookup as not-found, and returns an existing ID even when update failed. Creation omits most supplied profile fields.

**Fix:** Return typed `{ok,data,error}` results, derive connection state from an actual successful response, and abort upsert on lookup failure. Store stable CRM IDs or use server-side unique external IDs; paginate if needed. Create/update all intended fields and propagate failures to a retryable sync job.

### M11 — A2A helper reports JSON-RPC failures as successful empty replies

**Evidence:** `src/lib/a2a.ts:8,20-26,36-39`; comparison `scripts/run-fleet.js:59-74`.

The helper checks HTTP status but not JSON-RPC `error` or task failure. It also uses a different method/path/role/result envelope from the worker (`SendMessage`, `/a2a/v1/message`, `ROLE_USER` versus `message/send`, `/`, `user`, artifacts). Backend compatibility must be checked rather than assumed; the false-success behavior is unambiguous from source.

**Fix:** Use one versioned A2A adapter with contract tests, inspect error and task state, and collect text from the supported message/artifact envelope. Mark missing/unparseable results as failures. Parse peer-token env values with a proper dotenv parser rather than accepting only double-quoted values (`src/lib/fleet.ts:36-38`).

### M12 — Fleet run has no durable claim/recovery and marks failed steps “done”

**Evidence:** `scripts/run-fleet.js:78-88,97-109`; `src/app/api/fleet/run/route.ts:15-16`.

Multiple worker invocations can read `queued` before either writes `running`. A crash leaves `running` forever and the API blocks every new run. Exceptions are logged per step but the final state is always `done`; HTTP/JSON-RPC errors can become a `(no reply)` success.

**Fix:** Add an atomic run claim with run ID, owner lease and heartbeat; expire/recover stale runs. Distinguish completed/partial/failed, validate agent responses, and prevent downstream phases from proceeding without required upstream results. This is separate from C01's whole-book overwrite.

### M13 — Rebuild can report ready after a failed deploy; internal job states leak into demo approval

**Evidence:** `scripts/rebuild-worker.js:364-385`; `src/lib/data.ts:115-117,292-299`; `src/app/api/demos/route.ts:39,55`.

`dep.ok` is logged but not used as a failure gate; the code proceeds to check the old live page and may mark the new work ready. The worker also writes `pending-verify` (and failure logic writes `dead-letter`) into a domain status whose canonical union excludes them. Queue logic broadly includes every non-approved URL, conflating “under verification” and “ready for human approval.”

**Fix:** Stop and record retryable failure if deployment fails; verify the returned deployment/version specifically. Put job state in a separate `rebuildJob.status` enum, keeping `demo.status` canonical. Expose pending verification and dead letters explicitly, with approval unavailable until required QA completes.

### M14 — Vault folder matching can select the wrong company's files

**Evidence:** `src/lib/vault-reader.ts:24-35,50-64`.

If exact ID lookup fails, the first directory containing the first word of the company name is accepted. Common first words such as “Upstate” can resolve to another client. It can select a non-directory; missing root errors are not consistently contained. String-prefix containment is not realpath/symlink containment.

**Fix:** Store a verified `vaultFolder` mapping keyed by company ID. Require exact directory matches or fail with “unmapped”; never fuzzy-match a client file boundary. Resolve real paths under a configured root, reject symlinks/path escape, and handle missing roots consistently.

### M15 — Revenue drops out when a sold client moves to Build & Launch

**Evidence:** `src/lib/data.ts:706-717,319`; `src/app/reports/page.tsx:26-28`.

Revenue sums only companies currently at `sale`, although `build-launch` is also a client stage. Advancing a paying client makes its revenue disappear. Additionally, any bundled top-level `data.revenue` overrides the supplied live companies, reintroducing frozen totals when that legacy field exists.

**Fix:** Derive financial metrics from persistent billing/payment data, not current pipeline stage. At minimum include both closed-client stages and remove the bundled override when live companies are supplied. Clearly distinguish booked revenue, paid revenue and MRR.

### M16 — “Live” UI has independent one-shot snapshots and misleading health checks

**Evidence:** `src/hooks/use-pipeline.ts:21-54`; `src/app/page.tsx:139-153`; `src/app/api/agent/chat/route.ts:99-114`; `src/app/automation/page.tsx:118-122`.

Every hook instance owns separate state and fetches only on mount; mutation updates do not propagate to other instances/navigation badges. The health endpoint sends a real agent prompt for a one-word reply, consuming work/capacity rather than checking readiness. Automation hardcodes “All 3 online” without a probe.

**Fix:** Use one shared query cache with mutation invalidation and bounded focus/poll refresh; display last successful synchronization and stale/error states. Provide a token-free authenticated health/readiness endpoint, deduplicate probes, and render unknown/offline instead of hardcoded green status.

### M17 — Demo read failures masquerade as an empty approval queue; priority enrichment does not trigger sorting

**Evidence:** `src/app/demos/page.tsx:222-252,260-279,370-375,436-441`.

The loader never checks HTTP status. An error response without `demos` becomes `[]` and renders “All caught up”; a network failure on first load does the same. Priority metadata is populated in a module-level Map after `setDemos`, but no state update invalidates the memoized sort afterward, so the advertised priority order can remain wrong until another interaction. A relay failure warning after approval is stored on the card immediately after the card is removed, so Zach never sees it.

**Fix:** Keep explicit loading/error/empty states; retain previous results on failure. Include priority and age in the queue response or set a single enriched array in React state. Put delivery warnings in a persistent parent notification/job panel before removing the card.

### M18 — Demo audit marks unknown identity as “ok”

**Evidence:** `src/app/api/demos/audit/route.ts:24-37,78-86`.

An empty/missing title or company name returns `true` from identity matching. A 200 challenge page with no title or an empty response can pass the purported pre-send identity gate. Names that reduce to an empty core also match every title through `includes("")`. No content-type or positive identity proof is required.

**Fix:** Add an `unknown`/`needs-review` result for missing or unparseable identity evidence. Require successful HTML content and meaningful identity tokens before marking a demo verified; capture the verification revision/time. Keep the title heuristic as triage, not a sufficient send-authorization gate.

## LOW

### L01 — Form controls rely on placeholders instead of accessible labels

**Evidence:** `src/app/login/page.tsx:75-83`; `src/app/clients/page.tsx:49-53`; `src/components/client-approval-panel.tsx:289-312`; `src/app/approvals/page.tsx:80-92`; `src/components/global-search.tsx:53-60`.

Global search result buttons navigate only on `onMouseDown`, so normal keyboard button activation has no navigation handler.

**Fix:** Add associated `<label>` elements or meaningful `aria-label`s, connect validation via `aria-describedby`, and announce async errors/status with `role="alert"`/`aria-live`. Make search results links or handle `onClick` and implement appropriate keyboard/combobox behavior. Preserve visible focus and keyboard operation. This was a source review, not a screen-reader/contrast certification.

### L02 — Lint is not a usable quality gate, and there is no package test script

**Evidence:** `package.json:5-9`; representative weak boundary `src/lib/pipeline-store.ts:44,136`; unchecked cast `src/lib/data.ts:187`.

Actual lint results: 99 explicit-any errors, 9 set-state-in-effect errors, 2 static-components errors, 2 unescaped-entity errors, 1 prefer-const error, and 11 unused-variable warnings. A passing build therefore does not establish lint cleanliness or behavioral correctness. Some hook/compiler diagnostics require review rather than mechanical edits: `stageIcon` returns a stable map entry, so the static-components diagnostic is not proof that it creates a new component.

**Fix:** Add regression tests for persistence, approval revisions, route schemas and UI contracts; run typecheck, lint and tests in CI. Fix `any` at boundaries first, then retire dead code and triage hook rules. Do not disable all rules to obtain a green check.

### L03 — Unused approval/Supabase code preserves conflicting contracts

**Evidence:** `src/components/client-tabs.tsx:14`; `src/components/pitch-approval.tsx:11,28-38,44`; `src/components/pitch-review.tsx:21`; `src/lib/supabase-client.ts:1-9`; `supabase/migrations/0001_ll_os_schema.sql:48-61`.

Source searches found no callers of those exported legacy components or Supabase client. The unused pitch widget cannot reject successfully because it omits required feedback; its vocabulary is obsolete. Supabase eagerly creates a client even with empty config; the migration enables profiles RLS without app policies and does not enable agency RLS. Those are future-integration issues, not current Blob authorization failures; an anon key is not itself a secret leak.

**Fix:** Remove or quarantine unused paths and document the one supported approval/store model. Before enabling Supabase, implement explicit policies/grants and lazy validated configuration, and mark service-role modules server-only. Do not report dead components as current workstation regressions.

### L04 — Dynamic filesystem imports still cause whole-project tracing warnings

**Evidence:** `src/lib/vault-reader.ts:28,57`; `src/app/api/client/file/route.ts:20-22`; `next.config.ts:3-5`; verified build log.

The comments claim dynamic imports prevent tracing, but the actual production build warns that these calls trace the whole project. Next also warns that it selected the parent workspace root due to multiple lockfiles and that the middleware convention is deprecated. These did not prevent this build from succeeding.

**Fix:** Set the intended Turbopack root explicitly; isolate local-only filesystem code and narrowly configure tracing/exclusion where safe. Verify traced output size rather than relying on dynamic import comments. Migrate middleware to the supported proxy convention in a separate tested change, preserving auth behavior.

### L05 — URL/date/display helpers have avoidable edge-case inconsistencies

**Evidence:** `src/lib/data.ts:265-269,379-385,859-867,884-888`; `src/lib/data.ts:192-195`; `src/lib/stages.ts:108-120`.

A blank `demo.url` prevents fallback to a populated legacy `demoUrl`; unparseable nonempty locations are labeled out-of-state; date-only strings are parsed in local time then formatted in UTC, producing date shifts in some timezones; `toHref` accepts anything beginning with `http` rather than a parsed HTTP(S) URL. Fallback stage icons `Send`, `Message`, `Dollar` are absent from the icon map and become circles.

**Fix:** Select the first nonblank validated demo URL, return unknown for ambiguous regions, parse date-only values consistently in UTC, use the URL parser with a scheme allowlist, and align icon names with the registry. Add table-driven tests for these edge cases.

### L06 — Stale copy encourages obsolete pricing and unsafe default outreach

**Evidence:** `src/app/approvals/page.tsx:90`; `src/app/api/pipeline/leads/route.ts:46,76-85`; `src/app/automation/page.tsx:121-122`.

The rejection placeholder suggests lowering the price to the retired `$300` offer. New leads default to Greenville, SC and get a “Call” playbook even when those facts/channel permissions were not supplied. This contradicts the project's stored email-first SC outreach policy; this report makes no independent legal determination.

**Fix:** Replace retired-price examples, preserve unknown locations instead of inventing them, and create next steps based on verified territory/contact-channel policy. Centralize offer wording and remove hardcoded claims of service availability.

## Highest-leverage improvement

**Create one authoritative, typed command layer for the live book, used by routes AND workers, with origin reads, mandatory ETag commits, revision-bound approvals and a transactional outbox.** Keep long-running agent/build/CRM work outside the mutation; workers atomically claim a job and commit only owned fields. This addresses the three whole-book loss paths first, then makes delivery, retry and UI state truthful. A database migration is optional; do not delay basic fail-closed/CAS fixes waiting for one.

Recommended order:

1. Disable unsafe automatic full-book replacement/recovery paths; protect and back up the live book.
2. Repair store semantics and move every writer onto the shared mutation boundary.
3. Make the workstation live and normalize stage/status/approval transitions.
4. Add revision checks and durable job delivery; surface failure/retry states.
5. Harden auth, network transport, input schemas and URL fetching; add regression tests.

## Search results and coverage appendix

### Search interpretation

- In `src/`, the combined marker search returned 103 matching lines, primarily `any` and one `as unknown as` cast (`src/lib/data.ts:187`). No `TODO`, `FIXME`, `HACK`, `@ts-ignore`, or `console.log` matches were found there.
- In `scripts/`, the combined search returned 68 matching lines, largely expected CLI `console.log` statements and prose/Python `any`. `demo-content-qa.py:33` contains `TODO` as an input-content detection pattern, not an unfinished task. Logging alone is not a correctness finding; redact sensitive data and keep purposeful operational logs.
- Regex match counts are not issue counts. Findings are grouped by independently actionable root cause.

### Full deep-read targets

All **12** `src/lib/*.ts` modules: `a2a`, `crm-client`, `data`, `email-gate`, `fleet`, `pipeline-store`, `stages`, `supabase-client`, `supabase-config`, `ui`, `utils`, `vault-reader`.

All **22** API route files:

- `agent/approve`, `agent/chat`, `approve-combined`, `auth/login`
- `client/activity`, `client/file`, `demos`, `demos/audit`, `email/verify`
- `fleet/activity`, `fleet/cron`, `fleet/dispatch`, `fleet/run`, `fleet/status`, `fleet/tasks`
- `pipeline/approve`, `pipeline/build-demo`, `pipeline/data`, `pipeline/leads`, `pipeline/leads/[id]`, `pipeline/leads/delete`, `pipeline/move`

Middleware and live-data hook were read in full. All **11** page files were included in the review, with deeper workflow analysis of Home, client workstation, Approvals, Demos and Fleet. Core components were traced against their route contracts; decorative primitives were not each subjected to exhaustive visual review.

### Important non-findings / boundaries

- Route-level writes examined use `mutatePipeline`; the major concurrency escapes are inside its fallback implementation and in scripts, not a claim that the known migrated routes still call `readPipelineSafe()+writePipeline()`.
- Authentication middleware fails closed when credentials are absent and gates the application/API except its declared public paths. Missing per-route auth is not automatically an unauthenticated endpoint when middleware covers it.
- Local-only `/api/client/file` and `/api/fleet/dispatch` return 503 intentionally. The actual current source also serves fleet status/tasks/activity/cron from Blob on Vercel and serves derived client activity without the local vault. These are not incorrectly reported as broken serverless routes.
- `client-tabs.tsx` is unused; `client-workstation.tsx` is the live work surface.
- No primary defect was found in the `cn` utility or the shared Tailwind card recipe strings. No claim is made that an env-named Supabase service key is exposed to a browser merely because a server config file names it.
- No destructive live concurrency test, outbound send, external security probe or end-to-end worker execution was run. The build/lint/typecheck outcomes above are actual executions; remote operational status remains outside this static review.
