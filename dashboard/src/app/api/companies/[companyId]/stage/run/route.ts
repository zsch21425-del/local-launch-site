import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/session";
import { readPipelineSafe } from "@/lib/pipeline-store";
import { getRelayUrl, getRelayToken } from "@/lib/relay-config";
import {
  newRunId,
  hashCompanyInputs,
  issueCompletionCapability,
  type StageWorkOrder,
} from "@/lib/stage-orders";
import { setStageRun } from "@/lib/stage-runs";

/**
 * POST /api/companies/[companyId]/stage/run
 *
 * PIN-ONLY (Zach). "Approve & run": create an idempotent run receipt and
 * dispatch a structured work order to Hermes (local) over the existing relay.
 * Zach is the sole approver; this does NOT advance any stage — it only asks
 * Hermes to do the work + double-checks for the CURRENT stage.
 */

const OPERATIONS: Record<string, { operation: "audit" | "build-demo" | "write-pitch" | "quality-check" | "monthly-seo"; checks: string[] }> = {
  audit: { operation: "audit", checks: ["six-pass-audit"] },
  pitch: { operation: "build-demo", checks: ["visual-8.5", "blind-critic-9.5", "six-pass-audit"] },
  "quality-check": { operation: "quality-check", checks: ["visual-8.5", "blind-critic-9.5"] },
  outreach: { operation: "write-pitch", checks: ["five-pitch-standards"] },
  sale: { operation: "monthly-seo", checks: ["six-pass-audit"] },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
  const spec = OPERATIONS[stage];
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
  const cap = issueCompletionCapability(runId, companyId, stage, inputRevision);
  if (!cap) {
    return NextResponse.json(
      { error: "completion capability unavailable (server misconfigured)" },
      { status: 500 },
    );
  }

  const workOrder: StageWorkOrder = {
    runId,
    companyId,
    stage,
    inputRevision,
    operation: spec.operation,
    requiredChecks: spec.checks,
    callbackUrl: `${req.nextUrl.origin}/api/companies/${companyId}/stage/complete`,
    requestedAt: new Date().toISOString(),
  };

  const relayBase = getRelayUrl();
  if (!relayBase) {
    return NextResponse.json(
      { ok: true, runId, dispatched: false, relayError: "relay not configured (HTTPS required)" },
      { status: 200 },
    );
  }

  const orderMessage = [
    `STAGE WORK ORDER (dashboard → Hermes)`,
    `runId: ${workOrder.runId}`,
    `companyId: ${workOrder.companyId}`,
    `stage: ${workOrder.stage} · operation: ${workOrder.operation}`,
    `inputRevision: ${workOrder.inputRevision}`,
    `requiredChecks: ${workOrder.requiredChecks.join(", ")}`,
    `capabilityToken: ${JSON.stringify(cap)}`,
    `callbackUrl: ${workOrder.callbackUrl}`,
    ``,
    `Do the work for the CURRENT stage + run the double-checks. Submit evidence to`,
    `the callbackUrl with the capabilityToken. Do NOT advance any stage — Zach does that.`,
  ].join("\n");

  let dispatched = false;
  let relayError: string | null = null;
  try {
    // Fire-and-forget dispatch. The relay /chat waits for the agent to REPLY
    // (minutes of real work), so we must NOT hold the serverless request open.
    // A timeout here means DELIVERY IS UNKNOWN (the relay may have accepted the
    // order or never received it) — NOT "delivered". Hermes must dedupe on runId
    // before executing, so a safe re-dispatch never double-runs the work.
    const res = await fetch(`${relayBase}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Relay-Token": getRelayToken() },
      body: JSON.stringify({ message: orderMessage, clientId: companyId }),
      signal: AbortSignal.timeout(6000),
    });
    dispatched = res.ok;
    if (!res.ok) relayError = `relay HTTP ${res.status}`;
  } catch (e: any) {
    relayError = e?.name === "TimeoutError" || e?.name === "AbortError"
      ? "delivery uncertain (relay did not ack)"
      : e?.message || "relay timeout";
    dispatched = false;
  }

  return NextResponse.json({
    ok: true,
    runId,
    stage,
    inputRevision,
    dispatched,
    relayError,
    note: dispatched
      ? "Work order dispatched — Hermes will submit evidence when done."
      : "Work order queued; delivery uncertain. Re-run if no evidence arrives (Hermes dedupes on runId).",
  });
}
