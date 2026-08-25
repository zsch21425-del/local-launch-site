import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { FLEET_AGENTS } from "@/lib/fleet";

export const dynamic = "force-dynamic";
const IS_SERVERLESS = !!process.env.VERCEL;


/** GET /api/fleet/status — live agent liveness + gateway health. */
export async function GET() {
  if (IS_SERVERLESS) {
    return NextResponse.json({ unavailable: true, reason: "local-only" }, { status: 503 });
  }
  const agents = [];
  for (const a of FLEET_AGENTS) {
    let online = false;
    try {
      const out = execSync(`systemctl --user is-active ${a.service}`, { timeout: 5000, encoding: "utf8" }).trim();
      online = out === "active";
    } catch {
      online = false;
    }

    let gateway: any = null;
    try {
      gateway = JSON.parse(readFileSync(`${a.home}/gateway_state.json`, "utf8"));
    } catch {
      gateway = null;
    }

    agents.push({
      name: a.name,
      label: a.label,
      role: a.role,
      port: a.port,
      online,
      gatewayState: gateway?.gateway_state ?? null,
      activeAgents: gateway?.active_agents ?? null,
      platforms: gateway?.platforms ?? null,
      updatedAt: gateway?.updated_at ?? null,
    });
  }
  return NextResponse.json({ agents, fetchedAt: new Date().toISOString() });
}
