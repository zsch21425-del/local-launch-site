#!/usr/bin/env node
/** queue-run.js — set fleetRun.status = "queued" (manual trigger / testing). */
const { put, get } = require("@vercel/blob");
const fs = require("fs");
const token = fs.readFileSync("/mnt/d/LocalLaunch/dashboard/.env.local", "utf8").match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m)[1];

async function blobGet() {
  const got = await get("pipeline.json", { access: "private", token });
  let text;
  if (typeof got.text === "function") text = await got.text();
  else {
    const reader = got.stream.getReader();
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
    text = new TextDecoder().decode(buf);
  }
  return JSON.parse(text);
}

(async () => {
  const data = await blobGet();
  data.fleetRun = {
    status: "queued",
    step: null,
    stepLabel: null,
    started: null,
    completed: null,
    log: [],
    steps: [
      { id: "scout", label: "Scout — finding new leads" },
      { id: "auditor", label: "Auditor — auditing leads" },
      { id: "closer", label: "Closer — drafting pitches" },
    ],
    queuedAt: new Date().toISOString(),
  };
  await put("pipeline.json", JSON.stringify(data, null, 2), { access: "private", allowOverwrite: true, token });
  console.log("queued");
})().catch((e) => {
  console.error("queue err:", e.message);
  process.exit(1);
});
