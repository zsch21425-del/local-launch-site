#!/usr/bin/env node
/**
 * run-fleet.js — steps through the Local Launch fan-out and writes live
 * progress to the pipeline's `fleetRun` field so the dashboard can poll it.
 *
 * Fired by cron (every 1 min); only runs when fleetRun.status === "queued".
 * Each step calls the Supervisor's FULL agent via A2A (which fans out to the
 * matching worker), then records the reply in the run log.
 */
const { put, get } = require("@vercel/blob");
const fs = require("fs");
const { randomUUID } = require("crypto");

// Secrets live in the gitignored .env.local (env var wins if set). Never
// hardcode a token — read it here. The values are rotated out-of-band.
function secret(key) {
  const fromEnv = process.env[key];
  if (fromEnv) return fromEnv;
  const m = fs
    .readFileSync("/mnt/d/LocalLaunch/dashboard/.env.local", "utf8")
    .match(new RegExp(`^${key}="?([^"\\r\\n]+)"?`, "m"));
  return (m && m[1]) || "";
}

const token = secret("BLOB_READ_WRITE_TOKEN");
const SUPERVISOR_URL = process.env.SUPERVISOR_A2A_URL || "http://127.0.0.1:9913/";
const A2A_TOKEN = secret("A2A_TOKEN");
if (!A2A_TOKEN) {
  console.error("[run-fleet] A2A_TOKEN not set — add it to .env.local (never hardcode).");
  process.exit(1);
}

const STEPS = [
  { id: "scout", label: "Scout — finding new leads", msg: "Fan out to Scout: find new no-website local businesses in the Greenville/Spartanburg area. Return the leads you found (business name + city + phone, if known)." },
  { id: "auditor", label: "Auditor — auditing leads", msg: "Fan out to Auditor: audit the newest leads in the pipeline. Return the audit results (G-SCORE, competitor check, site status)." },
  { id: "closer", label: "Closer — drafting pitches", msg: "Fan out to Closer: draft a pitch for the top 3 audited leads (highest G-SCORE / most likely to convert). Return the 3 pitch drafts, each ~150 words." },
];

async function streamText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(buf);
}

// Read the full book WITH its ETag for conditional writes — bug C01.
async function blobGet() {
  const got = await get("pipeline.json", { access: "private", token, useCache: false });
  if (!got || !got.stream) throw new Error("pipeline.json missing from Blob");
  const text = await streamText(got.stream);
  return { data: JSON.parse(text), etag: got.blob?.etag ?? null };
}

async function blobPut(data, etag) {
  await put("pipeline.json", JSON.stringify(data, null, 2), {
    access: "private",
    allowOverwrite: true,
    token,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

function isConflict(e) {
  return (
    e?.name === "BlobPreconditionFailedError" ||
    e?.statusCode === 412 ||
    /precondition failed/i.test(String(e?.message || ""))
  );
}

// Atomic claim: transition queued → running so exactly ONE worker wins (M12).
// Re-read the book, verify it is still `queued`, stamp our runId + claimedAt,
// and write with ifMatch. A precondition failure OR a status that is no longer
// `queued` means another invocation beat us here — return null and abort. This
// write is NEVER retried: a retry would be a second claim.
async function claimRun() {
  const { data, etag } = await blobGet();
  const run = data.fleetRun;
  if (!run || run.status !== "queued") return null;
  const now = new Date().toISOString();
  run.runId = randomUUID();
  run.status = "running";
  run.started = now;
  run.claimedAt = now;
  run.heartbeatAt = now;
  run.log = [];
  try {
    await blobPut(data, etag);
  } catch (e) {
    if (isConflict(e)) return null;
    throw e;
  }
  return run;
}

// Commit run state: this script owns only data.fleetRun. Re-read the book,
// re-apply fleetRun, write with ifMatch; on conflict re-read + re-apply
// (bounded). Never weaken to an unconditional overwrite.
//
// M12: once we hold the claim, bail out if the book's runId no longer matches
// ours — a stale-run reset (see /api/fleet/run) plus a fresh claim by another
// worker must not be clobbered by this now-orphaned invocation.
async function commitRun(run) {
  const MAX_ATTEMPTS = 3;
  run.heartbeatAt = new Date().toISOString();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data, etag } = await blobGet();
    if (
      run.runId &&
      data.fleetRun &&
      data.fleetRun.runId &&
      data.fleetRun.runId !== run.runId
    ) {
      throw new Error("run reclaimed by another worker — aborting");
    }
    data.fleetRun = run;
    try {
      await blobPut(data, etag);
      return;
    } catch (e) {
      if (!isConflict(e) || attempt === MAX_ATTEMPTS) throw e;
      console.warn(`[run-fleet] write conflict — retry ${attempt}/${MAX_ATTEMPTS}`);
    }
  }
}

async function a2a(message) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    method: "message/send",
    params: { message: { role: "user", parts: [{ type: "text", text: message }] } },
    id: 1,
  });
  const res = await fetch(SUPERVISOR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + A2A_TOKEN },
    body,
    signal: AbortSignal.timeout(300000),
  });
  const data = await res.json();
  const result = data.result || {};
  const parts = ((result.artifacts || [{}])[0].parts) || [];
  return (parts[0] && parts[0].text) || "(no reply)";
}

async function main() {
  const { data } = await blobGet();
  const pending = data.fleetRun;
  if (!pending || pending.status !== "queued") {
    console.log("[run-fleet] nothing queued");
    return;
  }

  const run = await claimRun();
  if (!run) {
    console.log("[run-fleet] run already claimed by another worker — aborting");
    return;
  }
  console.log(`[run-fleet] claimed run ${run.runId} — starting fan-out`);

  for (const s of STEPS) {
    run.step = s.id;
    run.stepLabel = s.label;
    await commitRun(run);
    console.log(`[run-fleet] ${s.id}…`);
    const entry = { step: s.id, label: s.label, at: new Date().toISOString() };
    try {
      const reply = await a2a(s.msg);
      // A blank / sentinel reply is a failed step, not a completed one (M12).
      if (!reply || !reply.trim() || reply.trim() === "(no reply)") {
        entry.error = "empty agent reply";
      } else {
        entry.reply = reply.slice(0, 800);
      }
    } catch (e) {
      entry.error = e.message;
    }
    run.log.push(entry);
    await commitRun(run);
  }

  // Final status reflects what actually happened (M12): all steps errored →
  // failed; some errored → partial; otherwise done.
  const failed = run.log.filter((e) => e.error);
  run.status =
    failed.length === 0 ? "done" : failed.length === run.log.length ? "failed" : "partial";
  run.error = failed.length
    ? failed.map((e) => `${e.step}: ${e.error}`).join("; ")
    : null;
  run.completed = new Date().toISOString();
  await commitRun(run);
  console.log(`[run-fleet] ${run.status}${run.error ? ` — ${run.error}` : ""}`);
}

main().catch((e) => {
  console.error("[run-fleet] ERR", e.message);
  process.exit(1);
});
