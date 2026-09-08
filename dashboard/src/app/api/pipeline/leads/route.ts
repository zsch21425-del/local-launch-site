import { NextRequest, NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";
import { isRequestAuthed } from "@/lib/session";
import { isObject, badField, str, strMax, optional } from "@/lib/validate";

const MAX_STR = 4000;

const VALID_PRIORITY = ["high", "medium-high", "medium", "low"];
// Runtime stage set — MUST match the StageId union in src/lib/data.ts.
// `sale` is the current closed-won stage; legacy `won`/`lost` are no longer
// accepted on new writes (H04). Existing records are left as-is (no migration).
const VALID_STAGES = ["prospect", "audit", "pitch", "contacted", "response", "sale", "build-launch"];

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
  if (!(await isRequestAuthed(req))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  // M06: valid JSON with wrong types (numeric name, object category, …) would
  // slip past the catch and throw on `.trim()` below → uncaught 500. Validate
  // the outer shape first; `priority` / `stage` values are still checked against
  // their allow-lists further down.
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object", field: "body" },
      { status: 400 },
    );
  }
  const s = (v: unknown) => optional(v, (x) => strMax(x, MAX_STR));
  const bad = badField(body, {
    name: (v) => strMax(v, MAX_STR),
    category: s,
    location: s,
    phone: s,
    website: s,
    priority: s,
    stage: s,
    summary: s,
  });
  if (bad) {
    return NextResponse.json(
      { error: `Invalid or missing field: ${bad}`, field: bad },
      { status: 400 },
    );
  }

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

  const now = new Date();
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

  try {
    const r = await mutatePipeline((data: any) => {
      // M09: a valid but empty book (`companies: []`, e.g. after the last lead
      // was deleted) is NOT a dead end — the first lead must be addable.
      // mutatePipeline() already fails closed on a missing/unreadable store, so
      // reaching the mutator means the book is real; an empty array is fine.
      const companies: any[] = Array.isArray(data?.companies)
        ? data.companies
        : (data.companies = []);
      const dup = companies.find(
        (c: any) =>
          (c.id ?? "").toLowerCase() === id.toLowerCase() ||
          (c.name ?? "").toLowerCase() === n.toLowerCase(),
      );
      if (dup) {
        const err: any = new Error("__DUP__");
        err.dup = dup;
        throw err;
      }
      companies.push(newCompany);
      return true;
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
    }
  } catch (e: any) {
    if (e?.message === "__DUP__")
      return NextResponse.json(
        { error: "Already in the dashboard", companyId: e.dup.id, name: e.dup.name, stage: e.dup.stage },
        { status: 409 },
      );
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, companyId: id, company: newCompany });
}
