// POST /api/pipeline/leads/delete — body: { companyId, undo? }
//
// M09: this is a SOFT delete. The company record is moved out of `companies`
// into `data.archivedCompanies` with an audit stamp (who/when/prevStage) rather
// than being irreversibly dropped. `{ companyId, undo: true }` restores the most
// recent archived copy. A genuinely empty book (all leads archived) is a valid
// state — the read/create paths handle `companies: []` as a real zero state.
import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";
import { isRequestAuthed } from "@/lib/session";

const ARCHIVE_CAP = 200;

export async function POST(req: NextRequest) {
  if (!(await isRequestAuthed(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { companyId, undo } = body as { companyId?: string; undo?: boolean };
  if (!companyId) return NextResponse.json({ error: "Missing companyId" }, { status: 400 });

  const now = new Date().toISOString();
  let restoredName = "";
  let archivedName = "";
  let archivedRecord: any = null;

  try {
    const r = await mutatePipeline((data: any) => {
      const companies: any[] = Array.isArray(data.companies)
        ? data.companies
        : (data.companies = []);
      const archive: any[] = Array.isArray(data.archivedCompanies)
        ? data.archivedCompanies
        : (data.archivedCompanies = []);

      if (undo) {
        // Restore the most recently archived copy of this id.
        const aIdx = [...archive]
          .map((c, i) => ({ c, i }))
          .reverse()
          .find(({ c }) => c?.id === companyId)?.i;
        if (aIdx === undefined || aIdx === -1) throw new Error("__NOTFOUND__");
        if (companies.some((c: any) => c.id === companyId)) throw new Error("__EXISTS__");
        const [rec] = archive.splice(aIdx, 1);
        const company = { ...rec };
        delete company._archive;
        company.lastUpdated = now.slice(0, 10);
        companies.push(company);
        restoredName = company.name || companyId;
        return true;
      }

      const idx = companies.findIndex((c: any) => c.id === companyId);
      if (idx === -1) throw new Error("__NOTFOUND__");
      const [removed] = companies.splice(idx, 1);
      archivedName = removed.name || companyId;
      archivedRecord = {
        ...removed,
        _archive: {
          archivedAt: now,
          archivedBy: "dashboard",
          prevStage: removed.stage ?? null,
        },
      };
      archive.push(archivedRecord);
      // Bound the audit trail so it can't grow without limit.
      if (archive.length > ARCHIVE_CAP) archive.splice(0, archive.length - ARCHIVE_CAP);
      return true;
    });
    if (!r.ok) return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
  } catch (e: any) {
    if (e?.message === "__NOTFOUND__")
      return NextResponse.json({ error: `Not found: ${companyId}` }, { status: 404 });
    if (e?.message === "__EXISTS__")
      return NextResponse.json({ error: `Already active: ${companyId}` }, { status: 409 });
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  if (undo) {
    return NextResponse.json({ ok: true, restored: restoredName, companyId });
  }
  return NextResponse.json({
    ok: true,
    archived: archivedName,
    removed: archivedName, // back-compat field name
    companyId,
    // Undo affordance: re-POST this to bring the lead back.
    undo: { path: "/api/pipeline/leads/delete", body: { companyId, undo: true } },
  });
}
