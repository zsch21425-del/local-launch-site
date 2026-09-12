#!/usr/bin/env node
/**
 * SUPERVISOR EXECUTOR — the local half of the autonomous-work build.
 *
 * The dashboard (Vercel serverless) is the CONTROL PLANE: it stores jobs,
 * artifacts, reviews, and gate state in the Blob, and it owns the approval UI.
 * It CANNOT build demos, run Camoufox visual QA, or run blind critics — those
 * need a real browser + vision + fresh-context sub-agents, which live HERE on
 * the Supervisor's machine.
 *
 * This script is the EXECUTOR. Run it locally (cron or manual). It:
 *   1. Polls the dashboard for jobs in an executable state (approved/queued).
 *   2. Dispatches the real work to fleet workers over A2A (build → Builder,
 *      audit → Auditor, etc.).
 *   3. Runs the expensive gates (visual QA 8.5 @ 1280+390, blind critics).
 *   4. Writes immutable artifacts + blind review attestations back to the
 *      dashboard API (which persists them to the Blob).
 *   5. Asks the dashboard's deterministic gate evaluator to grade the job; if
 *      it passes, the executor may advance the stage (subject to the policy).
 *
 * Hard rules enforced here (see references/autonomous-work-and-gates.md):
 *   - A worker SUBMITS an artifact; it never writes a gate result.
 *   - A reviewer is BLIND: it gets the frozen artifact + rubric, not the
 *     author identity, earlier reviews, or other reviewers' scores.
 *   - Only the dashboard gate evaluator marks "passed".
 *
 * Env: DASHBOARD_URL, DASHBOARD_TOKEN (both set locally — same values as Vercel).
 *
 * Usage: node scripts/supervisor-executor.mjs [--once] [--job <id>]
 */

const DASHBOARD_URL = (process.env.DASHBOARD_URL || "https://dashboard.locallaunchupstate.com").replace(/\/+$/, "");
const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || "";

if (!DASHBOARD_TOKEN) {
  console.error("FATAL: DASHBOARD_TOKEN is not set. Refusing to run without auth.");
  process.exit(1);
}

const ONCE = process.argv.includes("--once");
const JOB_ARG = process.argv.indexOf("--job");

async function api(path, opts = {}) {
  const res = await fetch(`${DASHBOARD_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DASHBOARD_TOKEN}`,
      ...(opts.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** Which states are executable by this executor. */
const EXECUTABLE_STATES = new Set(["approved", "queued"]);

async function listExecutableJobs() {
  const { jobs } = await api("/api/agent/jobs");
  return jobs.filter((j) => EXECUTABLE_STATES.has(j.state));
}

/**
 * STUB DISPATCH — the real worker fan-out uses A2A (see src/lib/a2a.ts and the
 * Supervisor's own SOUL). This function is where the work happens. Replace the
 * placeholder with the actual A2A call per actionType. Kept explicit so the
 * orchestration contract (submit artifact → review → evaluate) is visible.
 */
async function dispatchWork(job) {
  console.log(`[executor] dispatching ${job.actionType} for ${job.companyIds.length} companies (job ${job.id})`);
  // Per actionType, fan out to the right worker via A2A and collect the artifact.
  // The worker returns { location, kind, contentHash } — the executor NEVER
  // fabricates a hash; it must come from the actual artifact bytes.
  switch (job.actionType) {
    case "build-demo":
      return { kind: "demo", location: "https://<slug>-demo.vercel.app", contentHash: "sha256:REPLACE_WITH_REAL_HASH" };
    case "write-pitch":
      return { kind: "pitch", location: "blob:pitch/<companyId>", contentHash: "sha256:REPLACE_WITH_REAL_HASH" };
    case "audit":
      return { kind: "audit", location: "blob:audit/<companyId>", contentHash: "sha256:REPLACE_WITH_REAL_HASH" };
    case "monthly-seo":
      return { kind: "seo", location: "blob:seo/<companyId>", contentHash: "sha256:REPLACE_WITH_REAL_HASH" };
    default:
      return null; // "move" jobs are handled by the dashboard, not the executor.
  }
}

async function runJob(job) {
  console.log(`\n[executor] running job ${job.id} (${job.actionType})`);
  await api(`/api/agent/jobs/${job.id}?action=transition`, {
    method: "POST",
    body: JSON.stringify({ state: "running" }),
  });

  const artifact = await dispatchWork(job);
  if (artifact) {
    await api(`/api/agent/jobs/${job.id}?action=artifact`, {
      method: "POST",
      body: JSON.stringify({
        companyId: job.companyIds[0],
        kind: artifact.kind,
        version: 1,
        contentHash: artifact.contentHash,
        location: artifact.location,
      }),
    });
    console.log(`[executor] artifact registered for ${job.id}`);
  }

  // BLIND critics: dispatch reviewer sub-agents here (fresh context each).
  // Each returns a {reviewerRole, scores, verdict, notes, artifactHash}.
  // This is a stub — wire the actual critic sub-agents (see blind-critic-iteration).
  console.log(`[executor] would dispatch blind critics for ${job.id} (stub)`);

  // Grade it.
  const { passed, gates } = await api(`/api/agent/jobs/${job.id}?action=evaluate`, { method: "POST" });
  console.log(`[executor] gate evaluation for ${job.id}: passed=${passed}`, gates);
  return passed;
}

async function main() {
  if (JOB_ARG !== -1) {
    const id = process.argv[JOB_ARG + 1];
    const { job } = await api(`/api/agent/jobs/${id}`);
    await runJob(job);
    return;
  }

  const jobs = await listExecutableJobs();
  if (jobs.length === 0) {
    console.log("[executor] no executable jobs. (idle)");
    return;
  }
  console.log(`[executor] ${jobs.length} executable job(s) found`);
  for (const job of jobs) {
    try {
      await runJob(job);
    } catch (e) {
      console.error(`[executor] job ${job.id} failed:`, e.message);
      await api(`/api/agent/jobs/${job.id}?action=transition`, {
        method: "POST",
        body: JSON.stringify({ state: "failed" }),
      }).catch(() => {});
    }
  }
}

main().catch((e) => {
  console.error("[executor] fatal:", e.message);
  process.exit(1);
});

// Poll loop (unless --once).
if (!ONCE && JOB_ARG === -1) {
  setInterval(async () => {
    try {
      await main();
    } catch (e) {
      console.error("[executor] poll error:", e.message);
    }
  }, 30_000);
  console.log("[executor] polling every 30s. Ctrl-C to stop.");
}
