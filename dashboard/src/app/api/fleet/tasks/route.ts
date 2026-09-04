import { NextResponse } from "next/server";
import { FLEET_AGENTS } from "@/lib/fleet";
import { a2aSend } from "@/lib/a2a";
import { readPipelineSafe } from "@/lib/pipeline-store";

export const dynamic = "force-dynamic";

const IS_SERVERLESS = !!process.env.VERCEL;
// Server-side TTL cache so the 30s page refresh doesn't re-probe the fleet every tick.
let cache: { at: number; data: any } | null = null;
const CACHE_TTL_MS = 20000; // 20s — probes are slow; serve cached between refreshes

/** GET /api/fleet/tasks — probe each agent's current task via A2A, IN PARALLEL, cached. */
export async function GET() {
  if (IS_SERVERLESS) {
    const data = await readPipelineSafe();
    const fs = data?.fleetStatus;
    return NextResponse.json({ agents: fs?.tasks ?? [], fetchedAt: fs?.fetchedAt ?? null, blob: true });
  }

  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return NextResponse.json({ ...cache.data, cached: true, fetchedAt: new Date().toISOString() });
  }

  // Parallel probes, each with a SHORT 8s cap (critic: 8×20s sequential = 160s worst case)
  const results = await Promise.all(
    FLEET_AGENTS.map(async (agent) => {
      const reply = await a2aSend(
        agent,
        "STATUS_PROBE: In one short line, what are you currently working on?",
        8000,
      );
      return {
        name: agent.name,
        label: agent.label,
        port: agent.port,
        ok: reply.ok,
        task: reply.text ? reply.text.slice(0, 300) : null,
        error: reply.error ?? null,
      };
    }),
  );

  const data = { agents: results, fetchedAt: new Date().toISOString() };
  cache = { at: now, data };
  return NextResponse.json(data);
}
