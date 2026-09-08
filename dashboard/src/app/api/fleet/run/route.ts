import { NextResponse } from "next/server";
import { mutatePipeline, readPipelineSafe } from "@/lib/pipeline-store";

export const dynamic = "force-dynamic";

const STEPS = [
  { id: "scout", label: "Scout — finding new leads" },
  { id: "auditor", label: "Auditor — auditing leads" },
  { id: "closer", label: "Closer — drafting pitches" },
];

/**
 * A claimed run whose worker has not written progress in this long is treated
 * as crashed (M12): the worker heartbeats `heartbeatAt` before every step, so
 * 10 min of silence means the process died mid-run and wedged the queue.
 */
const STALE_RUN_MS = 10 * 60 * 1000;

function isWedged(run: any): boolean {
  if (!run) return false;
  if (run.status !== "queued" && run.status !== "running") return false;
  const stamp = run.heartbeatAt || run.claimedAt || run.started || run.queuedAt;
  const ageMs = stamp ? Date.now() - new Date(stamp).getTime() : Number.POSITIVE_INFINITY;
  return ageMs > STALE_RUN_MS;
}

/**
 * POST /api/fleet/run — queue a full fan-out (picked up by the local cron).
 * Body (optional): { reset: true } to force-clear a wedged run even if it is
 * not yet past the stale threshold.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const forceReset = Boolean(body && typeof body === "object" && (body as any).reset);

  let recovered = false;
  const r = await mutatePipeline((data: any) => {
    const existing = data.fleetRun;
    const inFlight =
      existing && (existing.status === "queued" || existing.status === "running");
    // Only refuse when the in-flight run is still alive. A stale/wedged run
    // (crashed worker) — or an explicit reset — is cleared and replaced.
    if (inFlight && !forceReset && !isWedged(existing)) return false;
    recovered = Boolean(inFlight);
    data.fleetRun = {
      status: "queued",
      runId: null,
      step: null,
      stepLabel: null,
      started: null,
      claimedAt: null,
      heartbeatAt: null,
      completed: null,
      error: null,
      log: [],
      steps: STEPS,
      queuedAt: new Date().toISOString(),
      ...(recovered ? { recoveredFrom: existing?.runId ?? existing?.status ?? "unknown" } : {}),
    };
    return true;
  });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  if (r.result === false) {
    return NextResponse.json({ ok: false, error: "A pipeline run is already in progress" }, { status: 409 });
  }
  return NextResponse.json({ ok: true, recovered, fleetRun: { status: "queued", steps: STEPS } });
}

/** GET /api/fleet/run — current run progress (polled by the dashboard). */
export async function GET() {
  const data = await readPipelineSafe();
  const fleetRun = data?.fleetRun ?? null;
  // `stale:true` → the run looks wedged (crashed worker); a POST will now be
  // accepted to recover the queue instead of 409-ing (M12).
  return NextResponse.json({ fleetRun, stale: isWedged(fleetRun) });
}
