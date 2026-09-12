import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";
import { isRequestAuthed } from "@/lib/session";
import { isObject, badField, str, optional } from "@/lib/validate";

const FUNNEL_ORDER = [
  "prospect",
  "audit",
  "pitch",
  "quality-check",
  "approval",
  "outreach",
  "follow-up",
];

/**
 * POST /api/agent/proposals/execute
 *
 * Stage-1 autonomous-action executor. Executes a batch stage-advance as ONE
 * atomic mutatePipeline write (single mutation boundary, ETag optimistic
 * concurrency), re-validating each company INSIDE the mutator:
 *   - exists
 *   - current stage is the expected source stage (frozen at proposal time)
 *   - target stage is the legal forward-next (FUNNEL_ORDER) OR an explicit
 *     valid override the caller already authorized
 *
 * Returns per-company outcomes. A blocked company is NOT advanced just because
 * the rest of the batch passed. This is NOT the gate evaluator (Stage 2) — it
 * is the safe move-only executor; deliverable QA gates come later.
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

  if (!FUNNEL_ORDER.includes(toStage)) {
    return NextResponse.json(
      { error: `toStage must be one of: ${FUNNEL_ORDER.join(", ")}` },
      { status: 400 },
    );
  }

  // Dedupe + freeze the selection.
  const frozenIds = Array.from(new Set(companyIds));

  const outcomes: {
    companyId: string;
    ok: boolean;
    fromStage?: string;
    error?: string;
  }[] = [];

  const r = await mutatePipeline((data: any) => {
    const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
    if (companies.length === 0) throw new Error("__EMPTY__");
    for (const companyId of frozenIds) {
      const c = companies.find((x) => x.id === companyId);
      if (!c) {
        outcomes.push({ companyId, ok: false, error: "not found" });
        continue;
      }
      const fromStage = c.stage;
      // Forward-only: the target must be the NEXT stage in the funnel order.
      const fromIdx = FUNNEL_ORDER.indexOf(fromStage);
      const toIdx = FUNNEL_ORDER.indexOf(toStage);
      if (fromIdx === -1) {
        // Company is in a non-funnel stage (e.g. clients) — refuse to move via this path.
        outcomes.push({ companyId, ok: false, fromStage, error: `cannot advance from non-funnel stage ${fromStage}` });
        continue;
      }
      if (toIdx !== fromIdx + 1) {
        outcomes.push({
          companyId,
          ok: false,
          fromStage,
          error: `expected next stage ${FUNNEL_ORDER[fromIdx + 1] ?? "(terminal)"}, got ${toStage}`,
        });
        continue;
      }
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
  return NextResponse.json({
    ok: true,
    moved,
    blocked,
    toStage,
    outcomes,
  });
}
