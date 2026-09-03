import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";

const ACCESS = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN;

function isAuthed(req: NextRequest) {
  return req.cookies.get("ll_dash_auth")?.value === ACCESS;
}

/**
 * Editable fields on the client workstation cold-call sheet. Whitelist keeps
 * arbitrary data out of the pipeline — only these keys can be updated.
 */
const EDITABLE_FIELDS = [
  "name",
  "category",
  "location",
  "phone",
  "email",
  "website",
  "facebook",
  "instagram",
  "ownerName",
  "offer",
  "priority",
  "summary",
  "responseStatus",
  "saleValue",
  "demoUrl",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

/**
 * PATCH /api/pipeline/leads/[id] — edit a single lead's fields.
 * Body: { fields: { [key]: value, ... } }
 * Only whitelisted fields are applied. Writes Blob (atomic via mutatePipeline).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const fields = (body?.fields ?? {}) as Record<string, unknown>;

  if (!fields || typeof fields !== "object" || Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "fields is required" }, { status: 400 });
  }

  // Whitelist filter
  const updates: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in fields) updates[key] = fields[key];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: `no editable fields provided; allowed: ${EDITABLE_FIELDS.join(", ")}` },
      { status: 400 },
    );
  }

  let updatedCompany: any = null;
  try {
    const r = await mutatePipeline((data: any) => {
      const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
      const idx = companies.findIndex(
        (c: any) => (c.id ?? "").toLowerCase() === id.toLowerCase(),
      );
      if (idx === -1) throw new Error("__NOTFOUND__");

      const now = new Date().toISOString().slice(0, 10);
      companies[idx] = { ...companies[idx], ...updates, lastUpdated: now };
      updatedCompany = companies[idx];
      return true;
    });
    if (!r.ok) return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
  } catch (e: any) {
    if (e?.message === "__NOTFOUND__")
      return NextResponse.json({ error: `Not found: ${id}` }, { status: 404 });
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, company: updatedCompany });
}
