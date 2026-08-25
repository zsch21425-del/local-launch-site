import { NextResponse } from "next/server";
import { readPipelineSafe, writePipeline } from "@/lib/pipeline-store";

const RELAY_URL = `${process.env.SUPERVISOR_RELAY_URL || "http://137.184.135.50:9930"}/chat`;

/**
 * POST: Unified pitch + demo approval. Writes Blob (live OS book), then relays
 * one combined decision to the Supervisor (who sends the email on approve).
 *
 * Body: { companyId, action: "approve" | "reject", reason?, suggestedFix? }
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, action, reason, suggestedFix } = body as {
    companyId?: string;
    action?: "approve" | "reject";
    reason?: string;
    suggestedFix?: string;
  };

  if (!companyId || !action) {
    return NextResponse.json({ error: "Missing companyId or action" }, { status: 400 });
  }
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }
  if (action === "reject" && (!reason || !reason.trim())) {
    return NextResponse.json({ error: "A rejection reason is required." }, { status: 400 });
  }

  const data = await readPipelineSafe();
  const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
  if (companies.length === 0) {
    return NextResponse.json({ error: "Pipeline store empty or unreadable" }, { status: 500 });
  }

  const company = companies.find((c: any) => c.id === companyId);
  if (!company) {
    return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
  }

  const now = new Date().toISOString();
  const hadPitch = !!company.pitchDraft;
  const hadDemo = !!(company.demoUrl || company.demo?.url);

  if (hadPitch) {
    const pitch = company.pitchDraft!;
    pitch.status = action === "approve" ? "zach-approved" : "rejected";
    if (action === "reject") {
      pitch.reviewFeedback = {
        reason: reason?.trim() ?? "",
        suggestedFix: suggestedFix?.trim() ?? "",
        reviewedAt: now,
      };
    } else {
      delete pitch.reviewFeedback;
    }
  }

  if (hadDemo) {
    company.demo = company.demo ?? {};
    company.demo.status = action === "approve" ? "approved" : "rejected";
    company.demo.reviewedAt = now;
    if (reason?.trim()) company.demo.notes = reason.trim();
  }

  const w = await writePipeline(data);
  if (!w.ok) {
    return NextResponse.json({ error: "writePipeline failed", detail: w.error }, { status: 500 });
  }

  const demoUrl = company.demo?.url ?? company.demoUrl ?? `https://${companyId}-demo.vercel.app`;
  const decisionMsg =
    action === "approve"
      ? `COMBINED APPROVAL for ${company.name} (${companyId}).${hadPitch ? ` Pitch draft approved — send the outreach email now (subject="${company.pitchDraft?.subject ?? ""}", channel=${company.pitchDraft?.channel ?? "email"}).` : ""}${hadDemo ? ` Demo approved: ${demoUrl}.` : ""} Proceed per Local Launch process: send the email and update the playbook to done.`
      : `COMBINED REJECTION for ${company.name} (${companyId}). Reason: "${reason?.trim()}".${suggestedFix?.trim() ? ` Suggested fix: "${suggestedFix.trim()}".` : ""}${hadPitch ? " Route the pitch back to the Closer for rework." : ""}${hadDemo ? " Route the demo back to the builder for rework." : ""} Re-submit to pending for re-approval after revision.`;

  setTimeout(() => {
    fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: decisionMsg }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => {
      /* best-effort relay; state already persisted */
    });
  }, 0);

  return NextResponse.json({ ok: true, action, hadPitch, hadDemo, relayed: true });
}
