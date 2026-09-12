import { put } from "@vercel/blob";
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

const token = loadEnv().BLOB_READ_WRITE_TOKEN;
if (!token) { console.error("no token"); process.exit(1); }

// Rollback point: pipeline_final.json IS the current live blob state
// (pricing+closes fixed, legacy stages) — written and read-back-verified earlier.
console.log("rollback point: scripts/pipeline_final.json (verified current live state)");

const migrated = fs.readFileSync(path.resolve(__dirname, "pipeline_migrated.json"), "utf8");
const parsed = JSON.parse(migrated);
console.log("writing", parsed.companies.length, "companies (stage-migrated) to blob...");
const putRes = await put("pipeline.json", migrated, { access: "private", allowOverwrite: true, token });
console.log("PUT ok:", putRes.url);
