import { NextResponse } from "next/server";
import { mutatePipeline, readPipelineSafe } from "@/lib/pipeline-store";

export const dynamic = "force-dynamic";

const STEPS = [
  { id: "scout", label: "Scout — finding new leads" },
  { id: "auditor", label: "Auditor — auditing leads" },
  { id: "closer", label: "Closer — drafting pitches" },
];

/** POST /api/fleet/run — queue a full fan-out (picked up by the local cron). */
export async function POST() {
  const r = await mutatePipeline((data: any) => {
    if (data.fleetRun && (data.fleetRun.status === "queued" || data.fleetRun.status === "running")) {
      return false;
    }
    data.fleetRun = {
      status: "queued",
      step: null,
      stepLabel: null,
      started: null,
      completed: null,
      log: [],
      steps: STEPS,
      queuedAt: new Date().toISOString(),
    };
    return true;
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  if (r.result === false) {
    return NextResponse.json({ ok: false, error: "A pipeline run is already in progress" }, { status: 409 });
  }
  return NextResponse.json({ ok: true, fleetRun: { status: "queued", steps: STEPS } });
}

/** GET /api/fleet/run — current run progress (polled by the dashboard). */
export async function GET() {
  const data = await readPipelineSafe();
  return NextResponse.json({ fleetRun: data?.fleetRun ?? null });
}
