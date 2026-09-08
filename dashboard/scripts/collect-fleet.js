#!/usr/bin/env node
/**
 * collect-fleet.js — gather the fleet's live state (agent status, current
 * tasks, A2A activity, cron runs) and push it to the Blob under `fleetStatus`
 * so the hosted dashboard can render the command center without local access.
 *
 * The fleet runs on the Orgo droplet (nohup'd `hermes -p <name> gateway run`
 * processes, no systemd), so all gathering happens remotely via one Orgo
 * bash-API call that runs a small Node script on Orgo and prints one JSON
 * blob. Runs via cron (every few min) on this machine; only the Blob push +
 * heartbeat stay local.
 */
const { put, get } = require("@vercel/blob");
const fs = require("fs");

const ORGO_COMPUTER_ID = "8428dd2b-167a-4b69-b567-31504bba446f";
const ORGO_API_KEY = fs.readFileSync("/home/zach/.config/orgo/env", "utf8").match(/^ORGO_API_KEY=(.+)$/m)[1].trim();

const FLEET_AGENTS = [
  { name: "local-launch-supervisor", label: "Supervisor (COO)", role: "Runs operations, sends approved pitches, routes rejections to Closer", port: 9913 },
  { name: "local-launch-scout", label: "Scout", role: "Finds no-site/weak-site trades prospects", port: 9914 },
  { name: "local-launch-auditor", label: "Auditor", role: "Audits prospects: website/GBP/reviews verification", port: 9915 },
  { name: "local-launch-closer", label: "Closer", role: "Revises rejected pitches, resubmits for approval", port: 9916 },
  { name: "local-launch-orchestrator", label: "Orchestrator", role: "Coordinates multi-agent work", port: 9917 },
  { name: "local-launch-verifier", label: "Verifier", role: "Verifies completed work", port: 9919 },
  { name: "builder", label: "Builder", role: "Builds client websites/demos", port: 9904 },
];

const token = fs.readFileSync("/mnt/d/LocalLaunch/dashboard/.env.local", "utf8").match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m)[1];

// Runs ON Orgo (root, no systemd). Reads each profile under ~/.hermes/profiles/<name>
// and prints one JSON blob: { status, tasks, activity, cron }.
function buildRemoteScript() {
  return `
const fs = require("fs");
const FLEET_AGENTS = ${JSON.stringify(FLEET_AGENTS)};
const HOME = "/root/.hermes/profiles";

function readPeerToken(name) {
  try {
    const env = fs.readFileSync(\`\${HOME}/\${name}/.env\`, "utf8");
    const m = env.match(/A2A_PEER_TOKENS="([^"]+)"/);
    if (!m) return "";
    const entries = m[1].split(",").map((e) => {
      const parts = e.split(":");
      return { k: parts[0].trim(), v: parts.slice(1).join(":").trim() };
    });
    const found = entries.find((e) => e.k === "assistant") ?? entries.find((e) => e.k === "default");
    return found?.v ?? "";
  } catch {
    return "";
  }
}

function isOnline(name) {
  try {
    const out = require("child_process").execSync(\`pgrep -f "hermes -p \${name} gateway run"\`, { encoding: "utf8" }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function getStatus() {
  return FLEET_AGENTS.map((a) => {
    const online = isOnline(a.name);
    let gateway = null;
    try {
      gateway = JSON.parse(fs.readFileSync(\`\${HOME}/\${a.name}/gateway_state.json\`, "utf8"));
    } catch {
      gateway = null;
    }
    return {
      name: a.name, label: a.label, role: a.role, port: a.port, online,
      gatewayState: gateway?.gateway_state ?? null,
      activeAgents: gateway?.active_agents ?? null,
      platforms: gateway?.platforms ?? null,
      updatedAt: gateway?.updated_at ?? null,
    };
  });
}

async function getTasks() {
  return await Promise.all(
    FLEET_AGENTS.map(async (a) => {
      const peerToken = readPeerToken(a.name);
      if (!peerToken) return { name: a.name, label: a.label, port: a.port, ok: false, task: null, error: "no token" };
      try {
        const res = await fetch(\`http://127.0.0.1:\${a.port}/a2a/v1/message\`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: \`Bearer \${peerToken}\` },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: \`collect-\${Date.now()}\`,
            method: "SendMessage",
            params: { message: { role: "ROLE_USER", parts: [{ text: "STATUS_PROBE: In one short line, what are you currently working on?" }] } },
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) return { name: a.name, label: a.label, port: a.port, ok: false, task: null, error: \`HTTP \${res.status}\` };
        const d = await res.json();
        const text = d?.result?.task?.status?.message?.parts?.[0]?.text ?? "";
        return { name: a.name, label: a.label, port: a.port, ok: true, task: text.slice(0, 300), error: null };
      } catch (e) {
        return { name: a.name, label: a.label, port: a.port, ok: false, task: null, error: e.message };
      }
    })
  );
}

function getActivity(limit) {
  const events = [];
  for (const a of FLEET_AGENTS) {
    try {
      const raw = fs.readFileSync(\`\${HOME}/\${a.name}/a2a_audit.jsonl\`, "utf8");
      const lines = raw.split("\\n").filter((l) => l.trim());
      for (const line of lines.slice(-limit)) {
        try {
          const d = JSON.parse(line);
          events.push({ ts: d.ts, agent: a.name, label: a.label, direction: d.direction, peer: d.peer, summary: (d.summary ?? "").slice(0, 400) });
        } catch {}
      }
    } catch {}
  }
  events.sort((x, y) => (y.ts ?? 0) - (x.ts ?? 0));
  return events.slice(0, limit ?? 50);
}

function getCron() {
  return FLEET_AGENTS.map((a) => {
    let jobs = [];
    try {
      const d = JSON.parse(fs.readFileSync(\`\${HOME}/\${a.name}/cron/jobs.json\`, "utf8"));
      jobs = Array.isArray(d) ? d : d.jobs ?? [];
    } catch {
      jobs = [];
    }
    const withRuns = jobs
      .filter((j) => j.last_run_at)
      .map((j) => ({
        name: j.name ?? j.id,
        schedule: typeof j.schedule === "string" ? j.schedule : j.schedule?.display ?? "",
        lastRunAt: j.last_run_at,
        lastStatus: j.last_status,
        enabled: j.enabled,
      }))
      .sort((x, y) => (y.lastRunAt ?? "").localeCompare(x.lastRunAt ?? ""))
      .slice(0, 8);
    return { name: a.name, label: a.label, jobCount: jobs.length, recentRuns: withRuns };
  });
}

(async () => {
  const status = getStatus();
  const activity = getActivity(40);
  const cron = getCron();
  const tasks = await getTasks();
  process.stdout.write(JSON.stringify({ status, tasks, activity, cron }));
})();
`;
}

async function orgoBash(command, timeoutSec) {
  const res = await fetch(`https://www.orgo.ai/api/computers/${ORGO_COMPUTER_ID}/bash`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ORGO_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ command, timeout: timeoutSec ?? 60 }),
    signal: AbortSignal.timeout((timeoutSec ?? 60) * 1000 + 15000),
  });
  const d = await res.json();
  if (!res.ok || d.success === false) throw new Error(d.error || `HTTP ${res.status}`);
  return d.output ?? "";
}

function offlineFallback(error) {
  const status = FLEET_AGENTS.map((a) => ({
    name: a.name, label: a.label, role: a.role, port: a.port, online: false,
    gatewayState: null, activeAgents: null, platforms: null, updatedAt: null,
  }));
  const tasks = FLEET_AGENTS.map((a) => ({ name: a.name, label: a.label, port: a.port, ok: false, task: null, error }));
  return { status, tasks, activity: [], cron: FLEET_AGENTS.map((a) => ({ name: a.name, label: a.label, jobCount: 0, recentRuns: [] })) };
}

async function gatherFleet() {
  const script = buildRemoteScript();
  const b64 = Buffer.from(script, "utf8").toString("base64");
  const command = `echo ${b64} | base64 -d > /tmp/orgo-fleet-collect.js && node /tmp/orgo-fleet-collect.js`;
  try {
    const output = orgoOutputToJson(await orgoBash(command, 45));
    return output;
  } catch (e) {
    console.error("[collect-fleet] Orgo call failed:", e.message);
    return offlineFallback(e.message);
  }
}

function orgoOutputToJson(output) {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON in Orgo output");
  return JSON.parse(output.slice(start, end + 1));
}

async function streamText(stream) {
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

// Read the full book WITH its ETag so we can do a conditional write and not
// clobber a concurrent mutation (approve/rework, run-fleet) — bug C01.
async function blobGet() {
  const got = await get("pipeline.json", { access: "private", token, useCache: false });
  if (!got || !got.stream) throw new Error("pipeline.json missing from Blob");
  const text = await streamText(got.stream);
  return { data: JSON.parse(text), etag: got.blob?.etag ?? null };
}

async function blobPut(data, etag) {
  await put("pipeline.json", JSON.stringify(data, null, 2), {
    access: "private",
    allowOverwrite: true,
    token,
    ...(etag ? { ifMatch: etag } : {}),
  });
}

function isConflict(e) {
  return (
    e?.name === "BlobPreconditionFailedError" ||
    e?.statusCode === 412 ||
    /precondition failed/i.test(String(e?.message || ""))
  );
}

// Apply only this script's owned field (data.fleetStatus) and commit with
// ifMatch. On a conflict, re-read + re-apply (bounded) — never fall back to an
// unconditional overwrite.
async function commitFleetStatus(fleetStatus) {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { data, etag } = await blobGet();
    data.fleetStatus = fleetStatus;
    try {
      await blobPut(data, etag);
      return;
    } catch (e) {
      if (!isConflict(e) || attempt === MAX_ATTEMPTS) throw e;
      console.warn(`[collect-fleet] write conflict — retry ${attempt}/${MAX_ATTEMPTS}`);
    }
  }
}

(async () => {
  const { status, tasks, activity, cron } = await gatherFleet();

  await commitFleetStatus({ status, tasks, activity, cron, fetchedAt: new Date().toISOString() });
  // heartbeat → droplet relay (lets the droplet detect this machine going down)
  try {
    await fetch("http://137.184.135.50:9930/heartbeat", { method: "POST", signal: AbortSignal.timeout(5000) });
  } catch {}
  console.log(`[collect-fleet] pushed: ${status.length} agents, ${tasks.length} tasks, ${activity.length} events, ${cron.length} cron groups`);
})().catch((e) => {
  console.error("[collect-fleet] ERR", e.message);
  process.exit(1);
});
