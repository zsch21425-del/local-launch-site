import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/session";
import { readPipelineSafe } from "@/lib/pipeline-store";

/**
 * GET /api/companies/[companyId]/stage/state
 * PIN-only read of the company's current stage + run receipt (for the UI).
 */
export async function GET(
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
  return NextResponse.json({ stage: c.stage, run: c.stageRun ?? null });
}
