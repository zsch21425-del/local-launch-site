// TEMP cleanup route for Phase 2 B3 test-lead removal. DELETE after use (mirrors seed-blob pattern).
// POST /api/pipeline/leads/delete — body: { companyId }
import { NextRequest, NextResponse } from "next/server";
import { readPipelineSafe, writePipeline } from "@/lib/pipeline-store";

const ACCESS = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN;

function isAuthed(req: NextRequest) {
  return req.cookies.get("ll_dash_auth")?.value === ACCESS;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { companyId } = body as { companyId?: string };
  if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

  const data: any = await readPipelineSafe();
  const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
  const idx = companies.findIndex((c: any) => c.id === companyId);
  if (idx === -1) return NextResponse.json({ error: `Not found: ${companyId}` }, { status: 404 });

  const [removed] = companies.splice(idx, 1);
  const w = await writePipeline(data);
  if (!w.ok) return NextResponse.json({ error: w.error, ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, removed: removed.name, companyId });
}
