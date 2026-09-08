// One-shot: assign canonical pitchDraft.status = "pending-review" to the 12
// companies whose pitch status is null. Reads the RAW Blob (preserves full shape),
// touches ONLY pitchDraft.status + lastUpdated on the target ids, writes back.
import { put, get } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load BLOB_READ_WRITE_TOKEN from dashboard/.env.local (never printed)
function loadEnv() {
  const p = path.resolve(__dirname, "..", ".env.local");
  const env = {};
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const TARGETS = [
  "machado-handyman",
  "taylor-jones-signature-tree",
  "devil-dog-fencing",
  "lucas-maintenance-power-soft-wash-llc",
  "perino-s-junk-removal",
  "sa-tree-service-more",
  "west-construction",
  "kandw-cleaning-service",
  "teds-handyman-service",
  "woodies",
  "rodriquez",
  "bb-painting",
];

async function readBlobStream(stream) {
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

const token = loadEnv().BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error("FATAL: BLOB_READ_WRITE_TOKEN not found in .env.local");
  process.exit(1);
}

const res = await get("pipeline.json", { access: "private", token });
if (!res || !res.stream) {
  console.error("FATAL: blob read returned no stream");
  process.exit(1);
}
const text = await readBlobStream(res.stream);
const data = JSON.parse(text);

const companies = data.companies;
console.log("RAW blob top-level keys:", Object.keys(data).join(", "));
console.log("companies:", companies.length);
console.log(
  "demoUrl before:",
  companies.filter((c) => c.demoUrl).length,
  "| ownerName before:",
  companies.filter((c) => c.ownerName).length
);

const today = new Date().toISOString().slice(0, 10);
let changed = 0;
const report = [];
for (const c of companies) {
  if (TARGETS.includes(c.id)) {
    const before = (c.pitchDraft && c.pitchDraft.status) ?? null;
    // touch ONLY status (create pitchDraft if somehow missing) + lastUpdated
    c.pitchDraft = c.pitchDraft ?? {};
    c.pitchDraft.status = "pending-review";
    c.lastUpdated = today;
    changed++;
    report.push(`${c.id}: ${JSON.stringify(before)} -> pending-review`);
  }
}
console.log("changed:", changed, "of", TARGETS.length);
console.log(report.join("\n"));

// sanity: ensure we didn't touch counts
console.log(
  "demoUrl after (in-memory):",
  companies.filter((c) => c.demoUrl).length,
  "| ownerName after (in-memory):",
  companies.filter((c) => c.ownerName).length
);

const out = JSON.stringify(data, null, 2);
const putRes = await put("pipeline.json", out, {
  access: "private",
  allowOverwrite: true,
  token,
});
console.log("PUT ok:", putRes.url);
