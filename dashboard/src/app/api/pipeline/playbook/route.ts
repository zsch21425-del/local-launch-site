import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";
import { isRequestAuthed } from "@/lib/session";
import { isObject, badField, str, bool } from "@/lib/validate";

/**
 * POST /api/pipeline/playbook — flip ONE playbook item's shared `done` flag.
 *
 * M08: checking a step used to write only browser localStorage, so other
 * devices/agents/reports kept seeing the file's original `done`. Completion is
 * authoritative state — it must live in pipeline.json. The checklist keeps a
 * local optimistic layer only; on success it reconciles to this write.
 *
 * Body: { companyId, itemId, done }
 */
export async function POST(req: NextRequest) {
  if (!(await isRequestAuthed(req)))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object", field: "body" },
      { status: 400 },
    );
  }
  const bad = badField(body, { companyId: str, itemId: str, done: bool });
  if (bad) {
    return NextResponse.json(
      { error: `Invalid or missing field: ${bad}`, field: bad },
      { status: 400 },
    );
  }
  const { companyId, itemId, done } = body as {
    companyId: string;
    itemId: string;
    done: boolean;
  };

  try {
    const r = await mutatePipeline((data: any) => {
      const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
      if (companies.length === 0) throw new Error("__EMPTY__");
      const company = companies.find((c: any) => c.id === companyId);
      if (!company) throw new Error("__NOTFOUND__");
      const items: any[] = Array.isArray(company.playbook) ? company.playbook : [];
      const item = items.find((i: any) => i.id === itemId);
      if (!item) throw new Error("__ITEM_NOTFOUND__");
      item.done = done;
      company.lastUpdated = new Date().toISOString().slice(0, 10);
      return { done: item.done };
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
    }
    return NextResponse.json({ ok: true, companyId, itemId, done: r.result?.done ?? done });
  } catch (e: any) {
    if (e?.message === "__EMPTY__")
      return NextResponse.json({ error: "Pipeline store empty or unreadable" }, { status: 500 });
    if (e?.message === "__NOTFOUND__")
      return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
    if (e?.message === "__ITEM_NOTFOUND__")
      return NextResponse.json({ error: `Playbook item not found: ${itemId}` }, { status: 404 });
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
