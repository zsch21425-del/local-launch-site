#!/usr/bin/env node
/**
 * collect-fleet.js — gather the fleet's live state (agent status, current
 * tasks, A2A activity, cron runs) and push it to the Blob under `fleetStatus`
 * so the hosted dashboard can render the command center without local access.
 *
 * Runs via cron (every few min). Cheap fields (status/activity/cron) + a
 * parallel A2A STATUS_PROBE for "what each agent is doing now".
 */
const { put, get } = require("@vercel/blob");
const fs = require("fs");
const { execSync } = require("child_process");

const HERMES_HOME = "/mnt/d/Hermes/hermes-home";
const FLEET_AGENTS = [
  { name: "local-launch-supervisor", label: "Supervisor (COO)", role: "Runs operations, sends approved pitches, routes rejections to Closer", port: 9913, service: "hermes-gateway-local-launch-supervisor.service", home: `${HERMES_HOME}/profiles/local-launch-supervisor` },
  { name: "local-launch-scout", label: "Scout", role: "Finds no-site/weak-site trades prospects", port: 9914, service: "hermes-gateway-local-launch-scout.service", home: `${HERMES_HOME}/profiles/local-launch-scout` },
  { name: "local-launch-auditor", label: "Auditor", role: "Audits prospects: website/GBP/reviews verification", port: 9915, service: "hermes-gateway-local-launch-auditor.service", home: `${HERMES_HOME}/profiles/local-launch-auditor` },
  { name: "local-launch-closer", label: "Closer", role: "Revises rejected pitches, resubmits for approval", port: 9916, service: "hermes-gateway-local-launch-closer.service", home: `${HERMES_HOME}/profiles/local-launch-closer` },
  { name: "local-launch-orchestrator", label: "Orchestrator", role: "Coordinates multi-agent work", port: 9917, service: "hermes-gateway-local-launch-orchestrator.service", home: `${HERMES_HOME}/profiles/local-launch-orchestrator` },
  { name: "builder", label: "Builder", role: "Builds client websites/demos", port: 9904, service: "hermes-gateway-builder.service", home: `${HERMES_HOME}/profiles/builder` },
];

const token = fs.readFileSync("/mnt/d/LocalLaunch/dashboard/.env.local", "utf8").match(/^BLOB_READ_WRITE_TOKEN="?([^"\r\n]+)"?/m)[1];

function readPeerToken(agent, identity) {
  try {
    const env = fs.readFileSync(`${agent.home}/.env`, "utf8");
    const m = env.match(/A2A_PEER_TOKENS="([^"]+)"/);
    if (!m) return "";
    const entries = m[1].split(",").map((e) => {
      const parts = e.split(":");
      return { k: parts[0].trim(), v: parts.slice(1).join(":").trim() };
    });
    const found = entries.find((e) => e.k === identity) ?? entries.find((e) => e.k === "default");
    return found?.v ?? "";
  } catch {
    return "";
  }
}

function getStatus() {
  return FLEET_AGENTS.map((a) => {
    let online = false;
    try {
      online = execSync(`systemctl --user is-active ${a.service}`, { timeout: 5000, encoding: "utf8" }).trim() === "active";
    } catch {
      online = false;
    }
    let gateway = null;
    try {
      gateway = JSON.parse(fs.readFileSync(`${a.home}/gateway_state.json`, "utf8"));
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
      const peerToken = readPeerToken(a, "assistant");
      if (!peerToken) return { name: a.name, label: a.label, ok: false, task: null, error: "no token" };
      try {
        const res = await fetch(`http://127.0.0.1:${a.port}/a2a/v1/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${peerToken}` },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: `collect-${Date.now()}`,
            method: "SendMessage",
            params: { message: { role: "ROLE_USER", parts: [{ text: "STATUS_PROBE: In one short line, what are you currently working on?" }] } },
          }),
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return { name: a.name, label: a.label, port: a.port, ok: false, task: null, error: `HTTP ${res.status}` };
        const d = await res.json();
        const text = d?.result?.task?.status?.message?.parts?.[0]?.text ?? "";
        return { name: a.name, label: a.label, port: a.port, ok: true, task: text.slice(0, 300), error: null };
      } catch (e) {
        return { name: a.name, label: a.label, ok: false, task: null, error: e.message };
      }
    })
  );
}

function getActivity(limit) {
  const events = [];
  for (const a of FLEET_AGENTS) {
    try {
      const raw = fs.readFileSync(`${a.home}/a2a_audit.jsonl`, "utf8");
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t) continue;
        try {
          const d = JSON.parse(t);
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
      const d = JSON.parse(fs.readFileSync(`${a.home}/cron/jobs.json`, "utf8"));
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

async function blobPut(data) {
  await put("pipeline.json", JSON.stringify(data, null, 2), { access: "private", allowOverwrite: true, token });
}

(async () => {
  const status = getStatus();
  const activity = getActivity(40);
  const cron = getCron();
  const tasks = await getTasks();

  const data = await blobGet();
  data.fleetStatus = { status, tasks, activity, cron, fetchedAt: new Date().toISOString() };
  await blobPut(data);
  // heartbeat → droplet relay (lets the droplet detect this machine going down)
  try {
    await fetch("http://137.184.135.50:9930/heartbeat", { method: "POST", signal: AbortSignal.timeout(5000) });
  } catch {}
  console.log(`[collect-fleet] pushed: ${status.length} agents, ${tasks.length} tasks, ${activity.length} events, ${cron.length} cron groups`);
})().catch((e) => {
  console.error("[collect-fleet] ERR", e.message);
  process.exit(1);
});
