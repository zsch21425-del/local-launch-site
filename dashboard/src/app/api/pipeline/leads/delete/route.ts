// POST /api/pipeline/leads/delete — body: { companyId }
import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";

const ACCESS = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN;

function isAuthed(req: NextRequest) {
  return req.cookies.get("ll_dash_auth")?.value === ACCESS;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { companyId } = body as { companyId?: string };
  if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

  let removedName = "";
  try {
    const r = await mutatePipeline((data: any) => {
      const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
      const idx = companies.findIndex((c: any) => c.id === companyId);
      if (idx === -1) throw new Error("__NOTFOUND__");
      const [removed] = companies.splice(idx, 1);
      removedName = removed.name;
      return true;
    });
    if (!r.ok) return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
  } catch (e: any) {
    if (e?.message === "__NOTFOUND__")
      return NextResponse.json({ error: `Not found: ${companyId}` }, { status: 404 });
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, removed: removedName, companyId });
}
