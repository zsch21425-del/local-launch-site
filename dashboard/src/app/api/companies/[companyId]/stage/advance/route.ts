import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/session";
import { mutatePipeline, readPipelineSafe } from "@/lib/pipeline-store";
import { evaluateTransition, FUNNEL_ORDER, TERMINAL_STAGE } from "@/lib/gates";
import { hashCompanyInputs, verifyRequiredChecks } from "@/lib/stage-orders";
import { isObject, badField, str } from "@/lib/validate";

/** The deliverable checks each stage's run must have attested (mirrors run route). */
const STAGE_CHECKS: Record<string, string[]> = {
  audit: ["six-pass-audit"],
  pitch: ["visual-8.5", "blind-critic-9.5", "six-pass-audit"],
  "quality-check": ["visual-8.5", "blind-critic-9.5"],
  outreach: ["five-pitch-standards"],
  sale: ["six-pass-audit"],
};

/**
 * POST /api/companies/[companyId]/stage/advance
 *
 * PIN-ONLY (Zach). "Approve checks & advance": atomically re-verify the
 * transition gates against the exact completed run + result digest, record
 * Zach's approval, and advance exactly ONE stage. Does NOT start work in the
 * next stage. Duplicate requests must not advance twice (the stage has already
 * moved, so the re-verify fails adjacency).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { companyId } = await params;
  const body = await req.json().catch(() => null);
  if (!isObject(body)) {
    return NextResponse.json({ error: "Body must be a JSON object", field: "body" }, { status: 400 });
  }
  const bad = badField(body, { runId: str, resultDigest: str });
  if (bad) {
    return NextResponse.json({ error: `Invalid or missing field: ${bad}`, field: bad }, { status: 400 });
  }
  const { runId, resultDigest } = body as { runId: string; resultDigest: string };

  // Read-only pre-check for a clean error message.
  const pre: any = await readPipelineSafe();
  const preCompany = pre.companies?.find((x: any) => x.id === companyId);
  if (!preCompany) return NextResponse.json({ error: "company not found" }, { status: 404 });

  const fromStage = preCompany.stage;
  const nextStage = FUNNEL_ORDER[FUNNEL_ORDER.indexOf(fromStage) + 1] ?? TERMINAL_STAGE;

  const r = await mutatePipeline((data: any) => {
    const c = data.companies?.find((x: any) => x.id === companyId);
    if (!c) return { code: "__NOTFOUND__" as const };

    // The run must be the one Zach reviewed, completed, with a matching digest.
    if (!c.stageRun || c.stageRun.runId !== runId) {
      return { code: "__STALE_RUN__" as const };
    }
    if (c.stageRun.status !== "completed") {
      return { code: "__NOT_COMPLETE__" as const };
    }
    if (c.stageRun.resultDigest !== resultDigest) {
      return { code: "__DIGEST_MISMATCH__" as const };
    }
    // Stale-advance guard: the run must be for the company's CURRENT stage and
    // the inputs must be unchanged since dispatch — otherwise Zach could advance
    // against evidence produced for a different stage or an edited company.
    if (c.stageRun.stage !== c.stage) {
      return { code: "__STALE_STAGE__" as const };
    }
    if (c.stageRun.inputRevision !== hashCompanyInputs(c)) {
      return { code: "__STALE_INPUTS__" as const };
    }

    // Evidence-bound checks: the run's attestations must actually satisfy the
    // stage's required deliverable checks (not just pre-existing company flags).
    const requiredChecks = STAGE_CHECKS[c.stage];
    if (requiredChecks && requiredChecks.length) {
      const verdict = verifyRequiredChecks(requiredChecks, c.stageRun.attestations ?? []);
      if (!verdict.ok) {
        return { code: "__CHECKS__" as const, missing: verdict.missing };
      }
    }

    // Re-verify the transition gates against the CURRENT (frozen) company.
    const gate = evaluateTransition(c, nextStage);
    if (!gate.ok) {
      return { code: "__GATE__" as const, error: gate.error, missing: gate.missing ?? [] };
    }

    c.stageRun.status = "approved";
    c.stageRun.approvedAt = new Date().toISOString();
    c.stage = nextStage;
    c.lastUpdated = new Date().toISOString().slice(0, 10);
    return { code: "__OK__" as const };
  });

  if (!r.ok) {
    return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
  }
  const outcome = r.result as { code: string; error?: string; missing?: string[] };
  if (outcome.code === "__NOTFOUND__") return NextResponse.json({ error: "company not found" }, { status: 404 });
  if (outcome.code === "__STALE_RUN__") return NextResponse.json({ error: "run id mismatch (stale)" }, { status: 409 });
  if (outcome.code === "__NOT_COMPLETE__") return NextResponse.json({ error: "run not completed yet" }, { status: 409 });
  if (outcome.code === "__DIGEST_MISMATCH__") return NextResponse.json({ error: "result digest mismatch" }, { status: 409 });
  if (outcome.code === "__STALE_STAGE__") return NextResponse.json({ error: "run is for a different stage (stale)" }, { status: 409 });
  if (outcome.code === "__STALE_INPUTS__") return NextResponse.json({ error: "company changed since dispatch — re-run the work" }, { status: 409 });
  if (outcome.code === "__CHECKS__") {
    return NextResponse.json(
      { error: "required checks not satisfied by submitted evidence", missing: outcome.missing ?? [], ok: false },
      { status: 422 },
    );
  }
  if (outcome.code === "__GATE__") {
    return NextResponse.json(
      { error: outcome.error, missing: outcome.missing ?? [], ok: false },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    companyId,
    from: fromStage,
    to: nextStage,
    approved: true,
  });
}
