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

async function rs(s) {
  const r = s.getReader();
  const c = [];
  for (;;) {
    const { done, v } = await r.read();
    if (done) break;
    if (v && v.length) c.push(v);
  }
  const total = c.reduce((x, y) => x + y.length, 0);
  const b = new Uint8Array(total);
  let o = 0; for (const z of c) { b.set(z, o); o += z.length; }
  return new TextDecoder().decode(b);
}

const t = loadEnv().BLOB_READ_WRITE_TOKEN;

async function readWithRetry(max = 6) {
  let last = null;
  for (let i = 0; i < max; i++) {
    const res = await get("pipeline.json", { access: "private", token: t });
    const txt = await rs(res.stream);
    try {
      const d = JSON.parse(txt);
      if (d && Array.isArray(d.companies) && d.companies.length > 0) return d;
      last = `empty (companies=${d?.companies?.length ?? "missing"})`;
    } catch (e) {
      last = e.message;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("blob read failed after retries: " + last);
}

const data = await readWithRetry();

const companies = data.companies ?? [];
let pricingFixed = 0;
const needsCloseFix = [];

for (const c of companies) {
  const body = c?.pitchDraft?.body;
  if (typeof body !== "string" || !body) continue;

  let changed = false;
  let newBody = body;

  // Deterministic pricing: $300 -> $599, $49 -> $149
  if (/\$300\b/.test(newBody)) { newBody = newBody.replace(/\$300\b/g, "$599"); changed = true; }
  if (/\$49\b/.test(newBody)) { newBody = newBody.replace(/\$49\b/g, "$149"); changed = true; }

  if (changed) {
    c.pitchDraft.body = newBody;
    pricingFixed++;
  }

  // Banned close -> needs natural rewrite (collect for subagents)
  if (/I look forward to hearing from you/i.test(newBody)) {
    needsCloseFix.push({ id: c.id, name: c.name, body: newBody });
  }

  // $90 audit tier -> distinct offer, needs judgment (collect for subagents too)
  if (/\$90\b/.test(newBody)) {
    needsCloseFix.push({ id: c.id, name: c.name, body: newBody, is90audit: true });
  }
}

// dedupe (a pitch can be both banned-close AND $90)
const seen = new Set();
const deduped = needsCloseFix.filter((e) => {
  if (seen.has(e.id)) return false;
  seen.add(e.id);
  return true;
});

console.log("companies:", companies.length);
console.log("pricing fixed (deterministic):", pricingFixed);
console.log("still need close/audit rewrite:", deduped.length);

// Save the intermediate fixed pipeline (NOT yet written to blob)
fs.writeFileSync(
  path.resolve(__dirname, "..", "scripts", "pipeline_pricing_fixed.json"),
  JSON.stringify(data, null, 2)
);

// Save the close-rewrite work list for subagents
fs.writeFileSync(
  path.resolve(__dirname, "..", "scripts", "close_rewrites.json"),
  JSON.stringify(deduped, null, 2)
);

console.log("WROTE pipeline_pricing_fixed.json + close_rewrites.json");
