/**
 * Fleet agent registry — the Local Launch agent roster.
 * Shared by /api/fleet/* routes. Server-side only (reads local systemd + files).
 */
import { readFileSync } from "fs";

export interface FleetAgent {
  name: string;        // profile name
  label: string;       // display label
  role: string;        // CEO/COO/worker description
  port: number;        // A2A port
  service: string;     // systemd unit name
  home: string;        // profile dir under HERMES_HOME
}

const HERMES_HOME = "/mnt/d/Hermes/hermes-home";

export const FLEET_AGENTS: FleetAgent[] = [
  { name: "local-launch-supervisor", label: "Supervisor (COO)", role: "Runs operations, sends approved pitches, routes rejections to Closer", port: 9913, service: "hermes-gateway-local-launch-supervisor.service", home: `${HERMES_HOME}/profiles/local-launch-supervisor` },
  { name: "local-launch-scout", label: "Scout", role: "Finds no-site/weak-site trades prospects", port: 9914, service: "hermes-gateway-local-launch-scout.service", home: `${HERMES_HOME}/profiles/local-launch-scout` },
  { name: "local-launch-auditor", label: "Auditor", role: "Audits prospects: website/GBP/reviews verification", port: 9915, service: "hermes-gateway-local-launch-auditor.service", home: `${HERMES_HOME}/profiles/local-launch-auditor` },
  { name: "local-launch-closer", label: "Closer", role: "Revises rejected pitches, resubmits for approval", port: 9916, service: "hermes-gateway-local-launch-closer.service", home: `${HERMES_HOME}/profiles/local-launch-closer` },
  { name: "local-launch-orchestrator", label: "Orchestrator", role: "Coordinates multi-agent work", port: 9917, service: "hermes-gateway-local-launch-orchestrator.service", home: `${HERMES_HOME}/profiles/local-launch-orchestrator` },
  { name: "builder", label: "Builder", role: "Builds client websites/demos", port: 9904, service: "hermes-gateway-builder.service", home: `${HERMES_HOME}/profiles/builder` },
];

export function agentByPort(port: number): FleetAgent | undefined {
  return FLEET_AGENTS.find((a) => a.port === port);
}

/** Read the caller-for-identity token from a peer profile's A2A_PEER_TOKENS.
 * identity = the name the CALLER presents as (default "assistant", falls back
 * to "default" for profiles that don't list an assistant entry, e.g. self). */
export function readPeerToken(agent: FleetAgent, identity = "assistant"): string {
  try {
    const env = readFileSync(`${agent.home}/.env`, "utf8");
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
