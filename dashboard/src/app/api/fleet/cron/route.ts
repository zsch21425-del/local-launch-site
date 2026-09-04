import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { FLEET_AGENTS } from "@/lib/fleet";
import { readPipelineSafe } from "@/lib/pipeline-store";

export const dynamic = "force-dynamic";
const IS_SERVERLESS = !!process.env.VERCEL;


/** GET /api/fleet/cron — last automated run per agent from cron/jobs.json. */
export async function GET() {
  if (IS_SERVERLESS) {
    const data = await readPipelineSafe();
    const fs = data?.fleetStatus;
    return NextResponse.json({ agents: fs?.cron ?? [], fetchedAt: fs?.fetchedAt ?? null, blob: true });
  }
  const agents = [];
  for (const a of FLEET_AGENTS) {
    let jobs: any[] = [];
    try {
      const d = JSON.parse(readFileSync(`${a.home}/cron/jobs.json`, "utf8"));
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
    agents.push({ name: a.name, label: a.label, jobCount: jobs.length, recentRuns: withRuns });
  }
  return NextResponse.json({ agents, fetchedAt: new Date().toISOString() });
}
