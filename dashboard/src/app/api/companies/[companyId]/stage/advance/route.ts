import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed, isSameOrigin } from "@/lib/session";
import { mutatePipeline, readPipelineSafe } from "@/lib/pipeline-store";
import { evaluateTransition, FUNNEL_ORDER, TERMINAL_STAGE } from "@/lib/gates";
import { hashCompanyInputs, verifyRequiredChecks } from "@/lib/stage-orders";
import { isObject } from "@/lib/validate";

/** The deliverable checks each stage's run must have attested (mirrors run route). */
const STAGE_CHECKS: Record<string, string[]> = {
  audit: ["six-pass-audit"],
  pitch: ["visual-8.5", "blind-critic-9.5", "six-pass-audit"],
  "quality-check": ["visual-8.5", "blind-critic-9.5"],
  outreach: ["five-pitch-standards"],
  sale: ["six-pass-audit"],
};

/**
 * Stages whose exit is a HUMAN decision (Zach's click), not machine work — so
 * they have NO run operation and advance WITHOUT a completed run. These are the
 * transitions where "the work" is Zach signing off or marking won, not Hermes
 * producing an artifact.
 *
 *   prospect → audit:      "start working on this lead" (no evidence needed)
 *   approval → outreach:   Zach's explicit sign-off on the final pitch/demo
 *   follow-up → sale:      Zach marks it WON (with positive revenue evidence)
 */
const HUMAN_ONLY_STAGES = new Set(["prospect", "approval", "follow-up"]);

/**
 * POST /api/companies/[companyId]/stage/advance
 *
 * PIN-ONLY (Zach). Two modes:
 *   - MACHINE stage (audit/pitch/quality-check/outreach/sale): requires the
 *     completed run + matching digest; verifies the run's attestations satisfy
 *     the deliverable checks AND the transition gates pass, then advances ONE
 *     stage.
 *   - HUMAN stage (prospect/approval/follow-up): NO run required — Zach's
 *     authenticated click IS the decision. The gate is still verified (e.g.
 *     follow-up→sale requires positive won-evidence), then advances one stage.
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
  const body = await req.json().catch(() => null);
  if (!isObject(body)) {
    return NextResponse.json({ error: "Body must be a JSON object", field: "body" }, { status: 400 });
  }

  // runId/resultDigest are REQUIRED for machine stages, absent for human stages.
  // We do NOT enforce them here — the precise requirement is enforced inside the
  // atomic mutation based on the company's actual (fresh) stage.
  const runId = typeof (body as any).runId === "string" ? (body as any).runId : undefined;
  const resultDigest = typeof (body as any).resultDigest === "string" ? (body as any).resultDigest : undefined;

  // Read-only pre-check for a clean "not found" + the current stage.
  const pre: any = await readPipelineSafe();
  const preCompany = pre.companies?.find((x: any) => x.id === companyId);
  if (!preCompany) return NextResponse.json({ error: "company not found" }, { status: 404 });
  const fromStage = preCompany.stage;

  const r = await mutatePipeline((data: any) => {
    const c = data.companies?.find((x: any) => x.id === companyId);
    if (!c) return { code: "__NOTFOUND__" as const };

    // Derive nextStage INSIDE the mutation from the fresh company stage (not the
    // pre-read) so a concurrent stage change can't cause a skip.
    const currentStage = c.stage;
    const nextStage = FUNNEL_ORDER[FUNNEL_ORDER.indexOf(currentStage) + 1] ?? TERMINAL_STAGE;
    const human = HUMAN_ONLY_STAGES.has(currentStage);

    if (human) {
      // Human decision: no run. Zach's authenticated click IS the decision.
      // For approval→outreach, record the sign-off; for follow-up→sale, the gate
      // (positive won-evidence) is what verifies "won".
      if (currentStage === "approval") {
        c.zachApproval = "approved";
        c.zachApprovedAt = new Date().toISOString();
      }
      const gate = evaluateTransition(c, nextStage);
      if (!gate.ok) {
        return { code: "__GATE__" as const, error: gate.error, missing: gate.missing ?? [] };
      }
      c.stage = nextStage;
      c.lastUpdated = new Date().toISOString().slice(0, 10);
      return { code: "__OK__" as const, nextStage };
    }

    // Machine stage: require a completed, digest-matched run for THIS stage.
    if (!runId || !resultDigest) {
      return { code: "__MISSING_RUN__" as const };
    }
    if (!c.stageRun || c.stageRun.runId !== runId) {
      return { code: "__STALE_RUN__" as const };
    }
    if (c.stageRun.status !== "completed") {
      return { code: "__NOT_COMPLETE__" as const };
    }
    if (c.stageRun.resultDigest !== resultDigest) {
      return { code: "__DIGEST_MISMATCH__" as const };
    }
    if (c.stageRun.stage !== currentStage) {
      return { code: "__STALE_STAGE__" as const };
    }
    if (c.stageRun.inputRevision !== hashCompanyInputs(c)) {
      return { code: "__STALE_INPUTS__" as const };
    }

    // Evidence-bound checks: the run's attestations must actually satisfy the
    // stage's required deliverable checks (not just pre-existing company flags).
    const requiredChecks = STAGE_CHECKS[currentStage];
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
    return { code: "__OK__" as const, nextStage };
  });

  if (!r.ok) {
    return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
  }
  const outcome = r.result as { code: string; error?: string; missing?: string[]; nextStage?: string };
  if (outcome.code === "__NOTFOUND__") return NextResponse.json({ error: "company not found" }, { status: 404 });
  if (outcome.code === "__MISSING_RUN__") return NextResponse.json({ error: "runId and resultDigest required for this stage" }, { status: 400 });
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
    to: outcome.nextStage,
    approved: true,
  });
}
