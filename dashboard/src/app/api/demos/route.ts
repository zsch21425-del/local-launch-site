import { NextResponse } from "next/server";
import { readPipelineSafe, writePipeline } from "@/lib/pipeline-store";

const RELAY_URL = `${process.env.SUPERVISOR_RELAY_URL || "http://137.184.135.50:9930"}/chat`;

/**
 * GET: list demos awaiting Zach's approval (and any rejected/rework, for re-review).
 * Phase 1: reads from Vercel Blob (the live OS book) so demo state is durable
 * across deploys and approvals stick.
 *
 * Filter: status !== "none" && status !== "approved" (rework/rejected stay visible).
 */
export async function GET() {
  const data = await readPipelineSafe();
  const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
  if (companies.length === 0) {
    return NextResponse.json(
      { error: "Pipeline store empty or unreadable", demos: [] },
      { status: 500 },
    );
  }

  const queue = companies
    .map((c) => {
      const explicit = c.demo?.url ?? c.demoUrl;
      const url = explicit ?? `https://${c.id}-demo.vercel.app`;
      const status: string = c.demo?.status ?? (explicit ? "pending" : "none");
      return { companyId: c.id, name: c.name, category: c.category, location: c.location, url, status };
    })
    .filter((d) => d.status !== "none" && d.status !== "approved");

  return NextResponse.json({ demos: queue });
}

/**
 * POST: approve or reject a demo.
 * Phase 1: read Blob, mutate, write Blob, then relay to Supervisor (fire-and-forget).
 * Replaces the old in-memory singleton mutation that was lost on every deploy.
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, action, notes } = body as {
    companyId?: string;
    action?: "approve" | "reject" | "rework";
    notes?: string;
  };

  if (!companyId || !action) {
    return NextResponse.json({ error: "Missing companyId or action" }, { status: 400 });
  }
  if (!["approve", "reject", "rework"].includes(action)) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }

  // Read Blob (the live book).
  const data = await readPipelineSafe();
  const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
  if (companies.length === 0) {
    return NextResponse.json({ error: "Pipeline store empty or unreadable" }, { status: 500 });
  }
  const company = companies.find((c: any) => c.id === companyId);
  if (!company) {
    return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
  }

  // Mutate in-place.
  company.demo = company.demo ?? {};
  if (action === "approve") company.demo.status = "approved";
  else if (action === "reject") company.demo.status = "rejected";
  else if (action === "rework") company.demo.status = "rework";
  company.demo.reviewedAt = new Date().toISOString();
  if (notes?.trim()) company.demo.notes = notes.trim();

  // Persist back to Blob (durable; survives deploys).
  const w = await writePipeline(data);
  if (!w.ok) {
    return NextResponse.json({ error: "writePipeline failed", detail: w.error }, { status: 500 });
  }

  // Relay to Supervisor (fire-and-forget) — mirrors pitch-approve.
  const msg =
    action === "approve"
      ? `DEMO APPROVED for ${company.name} (${companyId}). Demo URL: ${company.demo?.url ?? company.demoUrl ?? `https://${companyId}-demo.vercel.app`}. Proceed per Local Launch process: deploy if not live, then route to Zach's 'done' approval / outreach.`
      : `DEMO ${action.toUpperCase()} for ${company.name} (${companyId}).${notes?.trim() ? ` Reason: "${notes.trim()}".` : ""} Route back to the builder to rework the demo.`;

  setTimeout(() => {
    fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => {
      /* best-effort relay; state already persisted */
    });
  }, 0);

  return NextResponse.json({ ok: true, action, relayed: true });
}
