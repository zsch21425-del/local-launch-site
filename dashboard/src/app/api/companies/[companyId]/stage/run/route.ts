import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed, isSameOrigin } from "@/lib/session";
import { readPipelineSafe } from "@/lib/pipeline-store";
import {
  newRunId,
  hashCompanyInputs,
  issueCompletionCapability,
} from "@/lib/stage-orders";
import { setStageRun } from "@/lib/stage-runs";
import { STAGE_OPERATIONS } from "@/lib/work-queue";

/**
 * POST /api/companies/[companyId]/stage/run
 *
 * PIN-ONLY (Zach). "Approve & run": create an idempotent run receipt and
 * dispatch a structured work order to Hermes (local) over the existing relay.
 * Zach is the sole approver; this does NOT advance any stage — it only asks
 * Hermes to do the work + double-checks for the CURRENT stage.
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // CSRF: cookie-authenticated mutation — reject untrusted browser origins.
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden origin" }, { status: 403 });
  }
  const { companyId } = await params;

  const data: any = await readPipelineSafe();
  const c = data.companies?.find((x: any) => x.id === companyId);
  if (!c) return NextResponse.json({ error: "company not found" }, { status: 404 });

  // A run with an overlapping in-flight request is rejected unless explicitly
  // replaced (the UI asks first on failure).
  if (c.stageRun?.status === "requested") {
    return NextResponse.json(
      { error: "a run is already in progress for this company" },
      { status: 409 },
    );
  }

  const inputRevision = hashCompanyInputs(c);
  const runId = newRunId();
  const stage = c.stage;
  const spec = STAGE_OPERATIONS[stage];
  if (!spec) {
    return NextResponse.json(
      { error: `no run operation for stage "${stage}"` },
      { status: 400 },
    );
  }

  // Persist the run receipt FIRST (idempotent anchor), then dispatch.
  // NOTE: replace=false so the ATOMIC in-mutation overlap guard is authoritative.
  // The read-only pre-check above gives a fast 409, but the real enforcement is
  // inside mutatePipeline (concurrent requests can't both slip past it).
  const saved = await setStageRun(
    companyId,
    {
      runId,
      stage,
      inputRevision,
      requestedAt: new Date().toISOString(),
      status: "requested",
    },
    false,
  );
  if (!saved.ok) {
    // A 409-style overlap (a run is already in progress) surfaces here from the
    // atomic guard — map it to 409, not 500.
    const conflict = saved.error === "a run is already in progress";
    return NextResponse.json(
      { error: saved.error, ok: false },
      { status: conflict ? 409 : 500 },
    );
  }

  // Issue a run-bound capability so Hermes can submit evidence for THIS run only.
  // (Also re-issued at claim time — the queue hands the executor a fresh capability.)
  const cap = issueCompletionCapability(runId, companyId, stage, inputRevision);
  if (!cap) {
    return NextResponse.json(
      { error: "completion capability unavailable (server misconfigured)" },
      { status: 500 },
    );
  }

  // The run is now PENDING in the pull queue. The LOCAL executor claims it via
  // POST /api/work-queue/claim — no fire-and-forget relay dispatch (that was the
  // lost-order seam: the relay's 60s synchronous timeout killed every long work
  // order). Delivery is pull, so nothing can be lost.
  return NextResponse.json({
    ok: true,
    runId,
    stage,
    inputRevision,
    queued: true,
    note: "Work order queued. The local executor will claim it and submit evidence when done.",
  });
}
