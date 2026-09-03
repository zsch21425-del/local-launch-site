#!/usr/bin/env node
/**
 * rebuild-worker.js — closes the rework/approve loop.
 *
 * The dashboard relay (ll-relay.py / agent-processor.js) only forwards work
 * orders to a STATELESS chat endpoint (deepseek-v4-flash) and writes back its
 * text reply. Nothing ever rebuilds a demo. This worker is the missing half:
 *
 *   poll pipeline → find demo.status == "rework" → write BRIEF.md →
 *   run Claude Code /hallmark → redeploy via deploy.py → flip status to
 *   "pending" → record the activity.
 *
 * Run:  node dashboard/scripts/rebuild-worker.js [--dry-run] [--limit N]
 * Cron: every 5 min, --limit 1 (Claude Code rebuilds are slow; one per tick)
 */
const { put, get } = require("@vercel/blob");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const DASH = "/mnt/d/LocalLaunch/dashboard";
const DEMOS = "/mnt/d/LocalLaunch/demos";
const BLOB_PATH = "pipeline.json";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : 1;
})();

function loadToken() {
  const env = fs.readFileSync(path.join(DASH, ".env.local"), "utf8");
  const m = env.match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m);
  if (!m) throw new Error("no BLOB_READ_WRITE_TOKEN in .env.local");
  return m[1];
}

async function blobGet(token) {
  const got = await get(BLOB_PATH, { access: "private", token });
  let text;
  if (typeof got.text === "function") text = await got.text();
  else if (got.stream) {
    const reader = got.stream.getReader();
    const chunks = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    text = new TextDecoder().decode(
      (() => {
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const buf = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
          buf.set(c, off);
          off += c.length;
        }
        return buf;
      })(),
    );
  } else text = JSON.stringify(got);
  return JSON.parse(text);
}

async function blobPut(token, data) {
  await put(BLOB_PATH, JSON.stringify(data, null, 2), {
    access: "private",
    allowOverwrite: true,
    token,
  });
}

function claudeRebuild(dir, briefPath) {
  const CLAUDE = "/home/zach/.local/bin/claude";
  const invoke = [
    "Read BRIEF.md and execute the builder task with /hallmark.",
    "Edit as specified. You may Read,Edit,Write,Bash in this directory.",
    "When done, report concisely with the /hallmark critique stamp.",
  ].join(" ");
  const cmd = `echo ${JSON.stringify(invoke)} | ${CLAUDE} -p --model sonnet --max-turns 30 --dangerously-skip-permissions --allowedTools "Read,Edit,Write,Bash" > /tmp/claude-builder.log 2>&1`;
  const r = spawnSync("bash", ["-c", cmd], {
    cwd: dir,
    encoding: "utf8",
    timeout: 20 * 60 * 1000,
  });
  return { code: r.status, log: "/tmp/claude-builder.log" };
}

function redeploy(dir) {
  const deployPy = path.join(dir, "deploy.py");
  if (!fs.existsSync(deployPy)) return { ok: false, why: "no deploy.py" };
  const r = spawnSync("python3", [deployPy], {
    cwd: dir,
    encoding: "utf8",
    timeout: 5 * 60 * 1000,
  });
  return { ok: r.status === 0, code: r.status };
}

/**
 * Known wrong brands/emails that leaked from OTHER demos. Anything in this
 * list showing up in a demo's HTML means the rebuild didn't decontaminate it.
 * Add new strays here as they're found.
 */
const FORBIDDEN = [
  "Leo's Pro Line",
  "Leosproline",
  "leo's pro line",
  "Gray Wolf",
  "gray wolf",
];

/**
 * Deterministic post-rebuild verification. Fetches the live demo and checks
 * that the correct company identity is present and no foreign branding leaked
 * in. Returns an array of failure strings (empty = pass). Image/caption
 * alignment is a separate vision pass (see verify-demo.js).
 */
async function verifyRebuild(company, reason, allCompanies) {
  const liveUrl = `https://${company.id}-demo.vercel.app`;
  let html = "";
  try {
    const res = await fetch(liveUrl, { signal: AbortSignal.timeout(20000) });
    html = await res.text();
  } catch (e) {
    return [`could not fetch live demo: ${e.message}`];
  }
  const lower = html.toLowerCase();
  const failures = [];

  // 1. Correct company name present.
  if (company.name && !lower.includes(company.name.toLowerCase())) {
    failures.push(`company name "${company.name}" missing`);
  }

  // 2. Correct phone present (digits only — formatting may differ).
  if (company.phone) {
    const digits = company.phone.replace(/\D/g, "");
    if (digits && !html.includes(digits)) {
      failures.push(`phone ${company.phone} missing`);
    }
  }

  // 3. Known stray brands absent.
  for (const f of FORBIDDEN) {
    if (lower.includes(f.toLowerCase())) {
      failures.push(`forbidden brand "${f}" still present`);
    }
  }

  // 4. Cross-contamination: no OTHER company's distinctive name present.
  //    Catches any demo-leak (e.g. "Gray Wolf", "Brian Dillard") without a manual list.
  for (const other of allCompanies || []) {
    if (other.id === company.id) continue;
    const n = (other.name || "").trim();
    if (n.length < 8) continue; // skip short/ambiguous names
    if (lower.includes(n.toLowerCase())) {
      failures.push(`foreign company name "${n}" present`);
    }
  }

  // 5. Category/service check: the demo copy should mention the business's
  //    core service (last non-generic word of the category, stemmed).
  const category = (company.category || "").toLowerCase().trim();
  if (category) {
    const FILLER = new Set([
      "care", "service", "services", "and", "or", "general",
      "residential", "commercial", "home", "installation", "maintenance",
    ]);
    const words = category.split(/[\/,&\s]+/).filter(Boolean);
    let serviceWord = "";
    for (let i = words.length - 1; i >= 0; i--) {
      const stem = words[i].replace(/(ing|ers?|es|s)$/i, "");
      if (stem.length >= 3 && !FILLER.has(stem.toLowerCase())) {
        serviceWord = stem;
        break;
      }
    }
    if (serviceWord && !lower.includes(serviceWord.toLowerCase())) {
      failures.push(
        `copy doesn't mention core service "${serviceWord}" (category: ${company.category})`,
      );
    }
  }

  return failures;
}

function nowIso() {
  return new Date().toISOString();
}

async function main() {
  const token = loadToken();
  const data = await blobGet(token);

  const jobs = (data.companies || []).filter(
    (c) => c.demo?.status === "rework" || c.demo?.status === "rejected",
  );
  console.log(`[rebuild-worker] ${jobs.length} rework/rejected job(s) in queue.`);

  if (jobs.length === 0) return;
  if (DRY) {
    for (const c of jobs) {
      const fb = c.demo?.reviewFeedback || {};
      console.log(`  DRY  ${c.id}  reason="${fb.reason || c.demo?.notes || ""}"`);
    }
    return;
  }

  let done = 0;
  for (const c of jobs) {
    if (done >= LIMIT) break;

    const slug = c.id;
    const dir = path.join(DEMOS, slug);
    if (!fs.existsSync(dir)) {
      console.log(`  SKIP ${slug} — no source folder under demos/`);
      continue;
    }

    const fb = c.demo?.reviewFeedback || {};
    const reason = fb.reason || c.demo?.notes || "Rework requested";
    const fix = fb.suggestedFix || "";

    // 1. Write BRIEF.md with the rework notes + real facts.
    const brief = [
      `# Rework brief — ${c.name} (${slug})`,
      ``,
      `## Why this is being reworked`,
      reason,
      fix ? `\n## Suggested fix\n${fix}` : "",
      ``,
      `## Company facts (use these, do NOT invent)`,
      `- Name: ${c.name || "—"}`,
      `- Category: ${c.category || "—"}`,
      `- Location: ${c.location || "—"}`,
      `- Phone: ${c.phone || "—"}`,
      `- Email: ${c.email || "—"}`,
      `- Website: ${c.website || "—"}`,
      `- Summary: ${c.summary || "—"}`,
      ``,
      `## Hard rules`,
      `- Real HD background imagery on every section; no flat/plain-color cards.`,
      `- Keep the Local Launch footer; do NOT fabricate testimonials, reviews, or metrics.`,
      `- No SVG logos (JPG/PNG only). No emoji icons. Font Awesome icon badges.`,
      `- Rebuild the SAME property (before/after must be the same scene if a visualizer is used).`,
      `- Self-certify with the /hallmark critique stamp when done.`,
    ].join("\n");
    fs.writeFileSync(path.join(dir, "BRIEF.md"), brief);
    console.log(`  [${slug}] BRIEF.md written. Running Claude Code /hallmark…`);

    // 2. Rebuild.
    const build = claudeRebuild(dir, path.join(dir, "BRIEF.md"));
    console.log(`  [${slug}] claude exit=${build.code} log=${build.log}`);
    if (build.code !== 0) {
      console.log(
        `  [${slug}] ⚠ Claude Code failed (exit ${build.code}) — leaving status=rework for retry.`,
      );
      continue;
    }

    // 3. Redeploy.
    const dep = redeploy(dir);
    console.log(`  [${slug}] redeploy ok=${dep.ok}${dep.why ? ` (${dep.why})` : ""}`);

    // 3.5. Verify the rebuild actually fixed the complaint before flipping.
    const failures = await verifyRebuild(c, reason, data.companies);
    if (failures.length > 0) {
      console.log(
        `  [${slug}] ⚠ verification failed: ${failures.join("; ")} — leaving status=rework for retry.`,
      );
      c.demo.reviewFeedback = {
        reason: `Rebuild attempted but verification failed — ${failures.join("; ")}`,
        reviewedAt: nowIso(),
      };
      c.demo.notes = c.demo.reviewFeedback.reason;
      done += 1; // still persist the note so it's visible + can retry with context
      continue;
    }
    console.log(`  [${slug}] ✓ verification passed.`);

    // 4. Flip status. Image/caption reasons need a vision pass before "pending".
    const isVision = /image|title|caption|photo|card|match|picture|visual|icon|swap|label|mismatch/i.test(reason);
    c.demo.status = isVision ? "pending-verify" : "pending";
    c.demo.rebuiltAt = nowIso();
    c.demo.reviewFeedback = null;
    c.demo.notes = null;
    c.lastUpdated = nowIso().slice(0, 10);
    (c.timeline || (c.timeline = [])).unshift({
      ts: nowIso(),
      type: "playbook",
      detail: `Demo rebuilt after rework: "${reason.slice(0, 80)}"`,
      actor: "rebuild-worker",
    });
    done += 1;
    console.log(`  [${slug}] → demo.status = pending (ready for re-review).`);
  }

  if (done > 0) {
    await blobPut(token, data);
    console.log(`[rebuild-worker] ${done} job(s) rebuilt + saved to Blob.`);
  }
}

main().catch((e) => {
  console.error("[rebuild-worker] ERR", e);
  process.exit(1);
});
