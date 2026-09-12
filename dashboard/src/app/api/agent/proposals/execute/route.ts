import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline, readPipelineSafe } from "@/lib/pipeline-store";
import { isRequestAuthed } from "@/lib/session";
import { isObject, badField, str } from "@/lib/validate";
import { evaluateTransition, FUNNEL_ORDER } from "@/lib/gates";
import { createJob } from "@/lib/jobs";

/**
 * POST /api/agent/proposals/execute
 *
 * Stage-1/2 autonomous-action executor. Executes a batch stage-advance as ONE
 * atomic mutatePipeline write (single mutation boundary, ETag optimistic
 * concurrency). Each company is re-validated INSIDE the mutator against the
 * transition policy (gates.ts): adjacency (forward-only) AND required evidence.
 * A blocked company is NOT advanced because the rest of the batch passed; each
 * outcome is reported individually.
 *
 * The mutator runs ONLY when at least one company will actually move — a
 * fully-blocked batch is answered from a read-only pre-check and never writes
 * (a no-op write used to trip the ETag conflict retry loop).
 *
 * Also records the batch as a durable `move` job (state machine).
 */
export async function POST(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!isObject(body)) {
    return NextResponse.json({ error: "Body must be a JSON object", field: "body" }, { status: 400 });
  }
  const bad = badField(body, {
    companyIds: (v) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string"),
    toStage: str,
  });
  if (bad) {
    return NextResponse.json({ error: `Invalid or missing field: ${bad}`, field: bad }, { status: 400 });
  }

  const companyIds = body.companyIds as string[];
  const toStage = (body.toStage as string).trim();

  if (!FUNNEL_ORDER.includes(toStage as any) && toStage !== "sale") {
    return NextResponse.json(
      { error: `toStage must be one of: ${FUNNEL_ORDER.join(", ")} or "sale"` },
      { status: 400 },
    );
  }

  const frozenIds = Array.from(new Set(companyIds));

  type Outcome = {
    companyId: string;
    ok: boolean;
    fromStage?: string;
    error?: string;
    missing?: string[];
  };

  // Read-only pre-check: compute outcomes. If nothing would move, answer now
  // and skip the write entirely.
  const pre = await readPipelineSafe();
  const preCompanies: any[] = Array.isArray(pre?.companies) ? pre.companies : [];
  const preOutcomes: Outcome[] = frozenIds.map((companyId) => {
    const c = preCompanies.find((x) => x.id === companyId);
    if (!c) return { companyId, ok: false, error: "not found" };
    const gate = evaluateTransition(c, toStage);
    if (!gate.ok) {
      return { companyId, ok: false, fromStage: c.stage, error: gate.error, missing: gate.missing };
    }
    return { companyId, ok: true, fromStage: c.stage };
  });

  const wouldMove = preOutcomes.some((o) => o.ok);
  if (!wouldMove) {
    return NextResponse.json({
      ok: true,
      moved: 0,
      blocked: preOutcomes.length,
      toStage,
      outcomes: preOutcomes,
    });
  }

  // At least one moves: apply atomically, re-checking each INSIDE the mutator.
  const outcomes: Outcome[] = [];
  const r = await mutatePipeline((data: any) => {
    const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
    if (companies.length === 0) throw new Error("__EMPTY__");
    for (const companyId of frozenIds) {
      const c = companies.find((x) => x.id === companyId);
      if (!c) {
        outcomes.push({ companyId, ok: false, error: "not found" });
        continue;
      }
      const gate = evaluateTransition(c, toStage);
      if (!gate.ok) {
        outcomes.push({
          companyId,
          ok: false,
          fromStage: c.stage,
          error: gate.error,
          missing: gate.missing,
        });
        continue;
      }
      const fromStage = c.stage;
      c.stage = toStage;
      c.lastUpdated = new Date().toISOString().slice(0, 10);
      outcomes.push({ companyId, ok: true, fromStage });
    }
    return true;
  });

  if (!r.ok) {
    return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
  }

  const moved = outcomes.filter((o) => o.ok).length;
  const blocked = outcomes.filter((o) => !o.ok).length;

  // Record the move as a durable audit job (best-effort — the mutation above
  // already succeeded; a job-record failure must not roll back real movement).
  const now = new Date().toISOString();
  await createJob({
    id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actionType: "move",
    companyIds: frozenIds,
    targetStage: toStage,
    state: blocked === 0 ? "completed" : "failed",
    artifacts: [],
    reviews: [],
    outcomes,
    createdAt: now,
    updatedAt: now,
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    moved,
    blocked,
    toStage,
    outcomes,
  });
}
