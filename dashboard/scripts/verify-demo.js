#!/usr/bin/env node
/**
 * verify-demo.js — CLI helper for the vision-verification pass.
 *
 * The rebuild worker flips image/caption reworks to "pending-verify" (not
 * "pending") so a vision pass can confirm the fix before it's cleared. This
 * helper lets a Hermes agent (with vision) list those demos and flip them.
 *
 *   node scripts/verify-demo.js list                → JSON of pending-verify demos
 *   node scripts/verify-demo.js pass <id>           → mark fixed (pending)
 *   node scripts/verify-demo.js fail <id> "<why>"   → mark still-broken (rework)
 */
const { put, get } = require("@vercel/blob");
const fs = require("fs");

const token = fs
  .readFileSync("/mnt/d/LocalLaunch/dashboard/.env.local", "utf8")
  .match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m)[1];

async function readBlob() {
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

async function writeBlob(data) {
  await put("pipeline.json", JSON.stringify(data, null, 2), {
    access: "private",
    allowOverwrite: true,
    token,
  });
}

(async () => {
  const [cmd, ...rest] = process.argv.slice(2);
  const data = await readBlob();
  const companies = data.companies || [];

  if (cmd === "list") {
    const pend = companies.filter((c) => c.demo?.status === "pending-verify");
    console.log(
      JSON.stringify(
        pend.map((c) => ({
          id: c.id,
          name: c.name,
          reason: c.demo?.reviewFeedback?.reason || c.demo?.notes || "",
        })),
        null,
        2,
      ),
    );
  } else if (cmd === "pass" || cmd === "fail") {
    const id = rest[0];
    const reason = rest.slice(1).join(" ").trim();
    const c = companies.find((x) => x.id === id);
    if (!c) {
      console.error(`not found: ${id}`);
      process.exit(1);
    }
    c.demo = c.demo || {};
    if (cmd === "pass") {
      c.demo.status = "pending";
      c.demo.reviewFeedback = null;
      c.demo.notes = null;
      console.log(`${id}: pass → pending`);
    } else {
      c.demo.status = "rework";
      c.demo.reviewFeedback = { reason, reviewedAt: new Date().toISOString() };
      c.demo.notes = reason;
      console.log(`${id}: fail → rework (${reason})`);
    }
    await writeBlob(data);
  } else {
    console.error("usage: verify-demo.js list | pass <id> | fail <id> <reason>");
    process.exit(1);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
