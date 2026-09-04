#!/usr/bin/env node
/** status-run.js — print the current fleetRun field from the Blob (diagnostic). */
const { get } = require("@vercel/blob");
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
  console.log("companies:", Array.isArray(data.companies) ? data.companies.length : typeof data.companies);
  console.log("fleetRun:", JSON.stringify(data.fleetRun ?? null));
})().catch((e) => {
  console.error("status err:", e.message);
  process.exit(1);
});
