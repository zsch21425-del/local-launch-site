import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";

const ACCESS = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN;

function isAuthed(req: NextRequest) {
  return req.cookies.get("ll_dash_auth")?.value === ACCESS;
}

const VALID_STAGES = ["prospect", "audit", "pitch", "contacted", "response", "build-launch", "won", "lost"];

/**
 * POST /api/pipeline/move — move a company to another stage on the kanban.
 * Phase 2 (B2). Reads Blob, sets stage, writes Blob. Persists across devices.
 *
 * Body: { companyId, stage }
 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { companyId, stage } = body as { companyId?: string; stage?: string };
  if (!companyId || !stage) {
    return NextResponse.json({ error: "Missing companyId or stage" }, { status: 400 });
  }
  if (!VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: `stage must be one of: ${VALID_STAGES.join(", ")}` }, { status: 400 });
  }

  let origStage = "";
  try {
    const r = await mutatePipeline((data: any) => {
      const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
      if (companies.length === 0) throw new Error("__EMPTY__");
      const company = companies.find((c: any) => c.id === companyId);
      if (!company) throw new Error("__NOTFOUND__");
      origStage = company.stage;
      company.stage = stage;
      company.lastUpdated = new Date().toISOString().slice(0, 10);
      return true;
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
    }
  } catch (e: any) {
    if (e?.message === "__EMPTY__")
      return NextResponse.json({ error: "Pipeline store empty or unreadable" }, { status: 500 });
    if (e?.message === "__NOTFOUND__")
      return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, companyId, from: origStage, to: stage });
}
