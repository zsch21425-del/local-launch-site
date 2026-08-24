import { NextResponse } from "next/server";
import { getCompanies } from "@/lib/data";

const RELAY_URL = `${process.env.SUPERVISOR_RELAY_URL || "http://137.184.135.50:9930"}/chat`;

/**
 * GET: list demos awaiting Zach's approval (and any rejected, for re-review).
 * Reads from the same in-memory pipeline singleton as /api/pipeline/data
 * (getCompanies), NOT the Blob store, so it stays consistent with the
 * Approvals page and the live pipeline.json bundled at build time.
 */
export async function GET() {
  const companies: any[] = getCompanies();

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
 * POST: approve or reject a demo. Updates the in-memory pipeline singleton
 * (getCompanies) and relays the decision to the Supervisor (fire-and-forget),
 * who handles deploy/send per Local Launch process.
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
    action?: "approve" | "reject";
    notes?: string;
  };

  if (!companyId || !action) {
    return NextResponse.json({ error: "Missing companyId or action" }, { status: 400 });
  }
  if (!["approve", "reject", "rework"].includes(action)) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }

  const companies = getCompanies();
  const company = companies.find((c: any) => c.id === companyId);
  if (!company) {
    return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
  }

  // Update demo status on the in-memory singleton
  company.demo = company.demo ?? {};
  if (action === "approve") company.demo.status = "approved";
  else if (action === "reject") company.demo.status = "rejected";
  else if (action === "rework") company.demo.status = "rework";
  company.demo.reviewedAt = new Date().toISOString();
  if (notes?.trim()) company.demo.notes = notes.trim();

  // Relay to Supervisor (fire-and-forget) — mirrors pitch-approve.
  const msg =
    action === "approve"
      ? `DEMO APPROVED for ${company.name} (${companyId}). Demo URL: ${company.demo?.url ?? company.demoUrl ?? `https://${companyId}-demo.vercel.app`}. Proceed per Local Launch process: deploy if not live, then route to Zach's 'done' approval / outreach.`
      : `DEMO REJECTED for ${company.name} (${companyId}).${notes?.trim() ? ` Reason: "${notes.trim()}".` : ""} Route back to the builder to rework the demo.`;

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
