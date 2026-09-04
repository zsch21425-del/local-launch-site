#!/usr/bin/env node
/**
 * dead-letter-alert.js — watchdog for the dead-letter queue.
 * Prints an alert line (for Telegram delivery) only when demos have failed
 * their rebuild 3× and been dead-lettered. Empty output = no alert.
 *
 * Run by a Hermes cronjob (no_agent) every ~15 min, deliver to Telegram.
 */
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
  const dead = (data.companies || []).filter((c) => c.demo?.status === "dead-letter");
  if (dead.length === 0) process.exit(0); // no output → cron delivers nothing

  const lines = dead.map((c) => {
    const err = (c.demo?.lastError || "unknown error").slice(0, 90);
    return `• ${c.name || c.id} (${c.id}) — ${err}`;
  });
  console.log(
    `⚠️ ${dead.length} demo(s) dead-lettered after 3 failed rebuilds:\n` +
      lines.join("\n") +
      `\n\nClear or re-queue them in the dashboard (/demos).`,
  );
})().catch((e) => {
  console.error("dead-letter-alert ERR:", e.message);
  process.exit(1);
});
