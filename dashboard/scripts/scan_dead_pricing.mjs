import { get } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const p = path.resolve(__dirname, "..", ".env.local");
  const env = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function readBlobStream(stream) {
  const reader = stream.getReader();
  const chunks = [];
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
  const buf = new Uint8Array(chunks.reduce((s, c) => s + c.length, 0));
  let off = 0; for (const c of chunks) { buf.set(c, off); off += c.length; }
  return new TextDecoder().decode(buf);
}

const token = loadEnv().BLOB_READ_WRITE_TOKEN;
if (!token) { console.error("no token"); process.exit(1); }

const res = await get("pipeline.json", { access: "private", token });
const data = JSON.parse(await readBlobStream(res.stream));

// Save the FULL pipeline snapshot locally (flaky reads make re-fetching risky)
fs.writeFileSync(
  path.resolve(__dirname, "..", "scripts", "pipeline_full_snapshot.json"),
  JSON.stringify(data, null, 2)
);
console.log("WROTE pipeline_full_snapshot.json (", data.companies?.length, "companies )");

const companies = data.companies ?? [];
const affected = companies.filter((c) => {
  const body = c?.pitchDraft?.body ?? "";
  if (!body) return false;
  return /\$300\b/.test(body) || /\$49\b/.test(body) || /I look forward to hearing from you/i.test(body);
});

console.log("TOTAL companies:", companies.length);
console.log("AFFECTED (dead pricing or banned close):", affected.length);
console.log("---");

// dump a summary for each affected
for (const c of affected) {
  const body = c?.pitchDraft?.body ?? "";
  const has300 = /\$300\b/.test(body);
  const has49 = /\$49\b/.test(body);
  const banned = /I look forward to hearing from you/i.test(body);
  const flags = [has300 ? "$300" : null, has49 ? "$49" : null, banned ? "banned-close" : null].filter(Boolean).join(",");
  console.log(`\n### ${c.id} | ${c.name} | stage=${c.stage} | flags=[${flags}]`);
  console.log("BODY (first 400):", body.slice(0, 400).replace(/\n/g, " "));
}

// write affected list to a file for the rewrite step
fs.writeFileSync(
  path.resolve(__dirname, "..", "scripts", "affected_pitches.json"),
  JSON.stringify(affected.map((c) => ({
    id: c.id,
    name: c.name,
    stage: c.stage,
    pitchDraft: c.pitchDraft,
  })), null, 2)
);
console.log("\n\nWROTE scripts/affected_pitches.json with", affected.length, "entries");

// Also dump 3 GOOD reference pitches (already $599, no dead pricing) as ground truth
const good = companies.filter((c) => {
  const b = c?.pitchDraft?.body ?? "";
  return b && /\$599/.test(b) && !/\$300\b/.test(b) && !/\$49\b/.test(b) && !/\$90\b/.test(b);
});
fs.writeFileSync(
  path.resolve(__dirname, "..", "scripts", "good_pitches_reference.json"),
  JSON.stringify(good.slice(0, 4).map((c) => ({ id: c.id, name: c.name, body: c.pitchDraft.body })), null, 2)
);
console.log("GOOD reference pitch count:", good.length);
for (const c of good.slice(0, 2)) {
  console.log("\n===== GOOD REF:", c.id, "|", c.name, "=====");
  console.log((c.pitchDraft.body || "").slice(0, 900));
}
