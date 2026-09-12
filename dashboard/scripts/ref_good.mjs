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
  for (;;) { const { done, v } = await r.read(); if (done) break; c.push(v); }
  const b = new Uint8Array(c.reduce((x, y) => x + y.length, 0));
  let o = 0; for (const z of c) { b.set(z, o); o += z.length; }
  return new TextDecoder().decode(b);
}

const t = loadEnv().BLOB_READ_WRITE_TOKEN;
const res = await get("pipeline.json", { access: "private", token: t });
const data = JSON.parse(await rs(res.stream));

const good = data.companies.filter((c) => {
  const b = c?.pitchDraft?.body ?? "";
  return b && /\$599/.test(b) && !/\$300\b/.test(b) && !/\$49\b/.test(b) && !/\$90\b/.test(b);
});

console.log("GOOD pitch count:", good.length);
for (const c of good.slice(0, 3)) {
  console.log("\n=====", c.id, "|", c.name, "|", c.stage, "=====");
  console.log((c.pitchDraft.body || "").slice(0, 1100));
}
