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

const token = fs
  .readFileSync("/mnt/d/LocalLaunch/dashboard/.env.local", "utf8")
  .match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m)[1];

const SUPERVISOR_URL = "http://127.0.0.1:9913/";
const A2A_TOKEN = "a2a_d45ce95e03f0c860a0e057796827638f";

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

// Commit run state: this script owns only data.fleetRun. Re-read the book,
// re-apply fleetRun, write with ifMatch; on conflict re-read + re-apply
// (bounded). Never weaken to an unconditional overwrite.
async function commitRun(run) {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data, etag } = await blobGet();
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
  const run = data.fleetRun;
  if (!run || run.status !== "queued") {
    console.log("[run-fleet] nothing queued");
    return;
  }

  run.status = "running";
  run.started = new Date().toISOString();
  run.log = [];
  await commitRun(run);
  console.log("[run-fleet] starting fan-out");

  for (const s of STEPS) {
    run.step = s.id;
    run.stepLabel = s.label;
    await commitRun(run);
    console.log(`[run-fleet] ${s.id}…`);
    const entry = { step: s.id, label: s.label, at: new Date().toISOString() };
    try {
      const reply = await a2a(s.msg);
      entry.reply = reply.slice(0, 800);
    } catch (e) {
      entry.error = e.message;
    }
    run.log.push(entry);
    await commitRun(run);
  }

  run.status = "done";
  run.completed = new Date().toISOString();
  await commitRun(run);
  console.log("[run-fleet] done");
}

main().catch((e) => {
  console.error("[run-fleet] ERR", e.message);
  process.exit(1);
});
