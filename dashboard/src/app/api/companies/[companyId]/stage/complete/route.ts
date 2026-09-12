import { NextRequest, NextResponse } from "next/server";
import { readPipelineSafe } from "@/lib/pipeline-store";
import { validateCompletionCapability, type StageResultEvidence } from "@/lib/stage-orders";
import { completeStageRun } from "@/lib/stage-runs";
import { isObject } from "@/lib/validate";

/**
 * POST /api/companies/[companyId]/stage/complete
 *
 * CAPABILITY-BOUND (Hermes). Submits evidence for the current run. The request
 * MUST carry a valid completion capability (runId + companyId + stage +
 * inputRevision + signature) issued at dispatch. Hermes may submit EVIDENCE —
 * never advance a stage, never approve. Any attempt to submit a `stage` field
 * or advance is rejected.
 */

const ARTIFACT_KINDS = ["demo", "pitch", "audit", "seo"];
const REVIEW_ROLES = ["ux", "product", "security", "visual", "audit"];

function validateEvidence(raw: any): { ok: boolean; error?: string; evidence?: StageResultEvidence } {
  if (!isObject(raw)) return { ok: false, error: "body must be an object" };
  const runId = raw.runId;
  const status = raw.status;
  const resultDigest = raw.resultDigest;
  if (typeof runId !== "string" || !runId) return { ok: false, error: "runId required" };
  if (status !== "completed" && status !== "failed") return { ok: false, error: "invalid status" };
  if (typeof resultDigest !== "string" || !resultDigest) return { ok: false, error: "resultDigest required" };
  // Reject any attempt to pass a stage field (advancement is dashboard-only).
  if (raw.stage !== undefined) return { ok: false, error: "stage may not be submitted here" };

  const artifacts: any[] = Array.isArray(raw.artifacts) ? raw.artifacts : [];
  for (const a of artifacts) {
    if (!ARTIFACT_KINDS.includes(a?.kind)) return { ok: false, error: "invalid artifact kind" };
    if (typeof a?.contentHash !== "string" || !a.contentHash) return { ok: false, error: "artifact contentHash required" };
    if (typeof a?.location !== "string" || !a.location) return { ok: false, error: "artifact location required" };
    if (typeof a?.version !== "number") return { ok: false, error: "artifact version required" };
  }
  const attestations: any[] = Array.isArray(raw.attestations) ? raw.attestations : [];
  for (const t of attestations) {
    if (!REVIEW_ROLES.includes(t?.reviewerRole)) return { ok: false, error: "invalid reviewer role" };
    if (typeof t?.reviewerId !== "string" || !t.reviewerId) return { ok: false, error: "reviewerId required" };
    if (typeof t?.blind !== "boolean") return { ok: false, error: "blind flag required" };
    if (t?.verdict !== "pass" && t?.verdict !== "fail") return { ok: false, error: "invalid verdict" };
    if (typeof t?.artifactHash !== "string" || !t.artifactHash) return { ok: false, error: "attestation artifactHash required" };
  }

  return {
    ok: true,
    evidence: {
      runId,
      companyId: raw.companyId,
      stage: raw.submittedStage, // informational only — validated against capability
      status,
      resultDigest,
      artifacts,
      attestations,
      error: raw.error,
    } as StageResultEvidence,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = validateEvidence(body);
  if (!parsed.ok || !parsed.evidence) {
    return NextResponse.json({ error: parsed.error, ok: false }, { status: 400 });
  }
  const evidence = parsed.evidence;

  // The capability is passed in a header (not the JSON body).
  const capRaw = req.headers.get("x-stage-capability");
  let cap: any = null;
  try {
    cap = capRaw ? JSON.parse(capRaw) : null;
  } catch {
    cap = null;
  }

  const data: any = await readPipelineSafe();
  const c = data.companies?.find((x: any) => x.id === companyId);
  if (!c) return NextResponse.json({ error: "company not found" }, { status: 404 });
  const run = c.stageRun;
  if (!run) return NextResponse.json({ error: "no run in progress" }, { status: 409 });

  // Validate the capability binds this exact run/company/stage/revision.
  const valid = validateCompletionCapability(cap, {
    runId: run.runId,
    companyId,
    stage: run.stage,
    inputRevision: run.inputRevision,
  });
  if (!valid) {
    return NextResponse.json({ error: "invalid or expired capability" }, { status: 403 });
  }
  if (evidence.runId !== run.runId) {
    return NextResponse.json({ error: "run id mismatch" }, { status: 409 });
  }

  const done = await completeStageRun(
    companyId,
    run.runId,
    evidence.status,
    evidence.resultDigest,
    evidence.error,
  );
  if (!done.ok) {
    return NextResponse.json({ error: done.error, ok: false }, { status: 409 });
  }

  return NextResponse.json({ ok: true, runId: run.runId, status: evidence.status });
}
