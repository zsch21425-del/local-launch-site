import { NextRequest, NextResponse } from "next/server";
import { readPipelineSafe, writePipeline } from "@/lib/pipeline-store";

const ACCESS = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN;

function isAuthed(req: NextRequest) {
  return req.cookies.get("ll_dash_auth")?.value === ACCESS;
}

const VALID_PRIORITY = ["high", "medium-high", "medium", "low"];
const VALID_STAGES = ["prospect", "audit", "pitch", "contacted", "response", "build-launch", "won", "lost"];

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "new-lead"
  );
}

/**
 * POST /api/pipeline/leads — add a new lead.
 * Phase 2 (B1). Reads Blob, appends the lead, writes Blob.
 * Rejects 409 if a company with the same name (case-insensitive) or slug already exists.
 *
 * Body: { name, category, location, phone?, website?, priority, stage, summary? }
 */
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, category, location, phone, website, priority, stage, summary } = body as {
    name?: string;
    category?: string;
    location?: string;
    phone?: string;
    website?: string;
    priority?: string;
    stage?: string;
    summary?: string;
  };

  const n = (name ?? "").trim();
  const cat = (category ?? "").trim() || "Uncategorized";
  const loc = (location ?? "").trim() || "Greenville, SC";
  const pr = (priority ?? "medium").trim();
  const st = (stage ?? "prospect").trim();
  const sum = (summary ?? "").trim();

  if (!n) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!VALID_PRIORITY.includes(pr)) {
    return NextResponse.json({ error: `priority must be one of: ${VALID_PRIORITY.join(", ")}` }, { status: 400 });
  }
  if (!VALID_STAGES.includes(st)) {
    return NextResponse.json({ error: `stage must be one of: ${VALID_STAGES.join(", ")}` }, { status: 400 });
  }

  const id = slugify(n);

  const data: any = await readPipelineSafe();
  const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
  if (companies.length === 0) {
    return NextResponse.json({ error: "Pipeline store empty or unreadable" }, { status: 500 });
  }

  // Reject 409 if already present (by id or case-insensitive name).
  const dup = companies.find(
    (c: any) =>
      (c.id ?? "").toLowerCase() === id.toLowerCase() ||
      (c.name ?? "").toLowerCase() === n.toLowerCase(),
  );
  if (dup) {
    return NextResponse.json(
      {
        error: "Already in the dashboard",
        companyId: dup.id,
        name: dup.name,
        stage: dup.stage,
      },
      { status: 409 },
    );
  }

  const now = new Date();
  // ISO date (YYYY-MM-DD) to match existing lastUpdated format.
  const isoDate = now.toISOString().slice(0, 10);

  const newCompany = {
    id,
    name: n,
    category: cat,
    stage: st,
    location: loc,
    phone,
    website,
    summary: sum,
    lastContact: "",
    lastUpdated: isoDate,
    priority: pr,
    playbook: [
      {
        id: `${id}-contact`,
        label: "Make initial contact",
        stage: "prospect",
        done: false,
        detail: phone ? `Call ${phone}.` : "Find a phone number and call.",
      },
    ],
    nextSteps: ["Make initial contact"],
    seoScore: null,
    gScore: null,
    saleValue: null,
    responseStatus: null,
    zachApproval: null,
  };
  companies.push(newCompany);

  const w = await writePipeline(data);
  if (!w.ok) {
    return NextResponse.json({ error: w.error, ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, companyId: id, company: newCompany });
}
