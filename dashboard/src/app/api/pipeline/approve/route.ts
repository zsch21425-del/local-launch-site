import { NextResponse } from "next/server";
import { readPipelineSafe, writePipeline } from "@/lib/pipeline-store";

const RELAY_URL = `${process.env.SUPERVISOR_RELAY_URL || "http://137.184.135.50:9930"}/chat`;

/** POST: approve/reject a pitch. Writes to Blob + local file (durable cross-device)
 * and relays the decision to the Supervisor (COO), who sends approved pitches as
 * emails / routes rejections to the Closer for rework.
 * Auth is enforced by middleware (DASHBOARD_TOKEN cookie or Bearer header). */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, status, reason, suggestedFix } = body as {
    companyId?: string;
    status?: "pending" | "supervisor-approved" | "zach-approved" | "rejected" | "conditional" | "sent";
    reason?: string;
    suggestedFix?: string;
  };

  if (!companyId || !status) {
    return NextResponse.json({ error: "Missing companyId or status" }, { status: 400 });
  }
  if (!["pending", "supervisor-approved", "zach-approved", "rejected", "conditional", "sent"].includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }
  // Rejection requires feedback so the agent can revise and resubmit.
  if (status === "rejected" && (!reason || !reason.trim())) {
    return NextResponse.json(
      { error: "A rejection reason is required so the pitch can be revised and resubmitted." },
      { status: 400 },
    );
  }

  // Read current data (durable source)
  const data: any = await readPipelineSafe();
  const companies = data.companies;
  if (!Array.isArray(companies)) {
    return NextResponse.json({ error: "Invalid pipeline data" }, { status: 500 });
  }

  const company = companies.find((c: any) => c.id === companyId);
  if (!company) {
    return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
  }
  if (!company.pitchDraft) {
    return NextResponse.json({ error: `Company has no pitch draft: ${companyId}` }, { status: 400 });
  }

  // Update status
  company.pitchDraft.status = status;
  if (status === "rejected") {
    company.pitchDraft.reviewFeedback = {
      reason: reason?.trim() ?? "",
      suggestedFix: suggestedFix?.trim() ?? "",
      reviewedAt: new Date().toISOString(),
    };
  } else {
    delete company.pitchDraft.reviewFeedback;
  }

  // Durable write (Blob + local file)
  const writeRes = await writePipeline(data);
  if (!writeRes.ok) {
    return NextResponse.json({ error: writeRes.error, ok: false }, { status: 500 });
  }

  // Relay to Supervisor (COO) — it sends approved emails / routes rejections to Closer.
  // FIRE-AND-FORGET (non-blocking): we don't await the relay so the user's Approve
  // click returns instantly. The supervisor is notified in the background.
  const draft = company.pitchDraft;
  const decisionMsg =
    status === "supervisor-approved" || status === "zach-approved"
      ? `PITCH APPROVED for ${company.name} (${companyId}). Send the outreach email: subject="${draft.subject}" channel=${draft.channel} body:\n${draft.body}\n\nPlease send it per Local Launch process and update the playbook.`
      : status === "rejected"
        ? `PITCH REJECTED for ${company.name} (${companyId}). Feedback to route to the Closer for rework: reason="${reason}" suggestedFix="${suggestedFix}". Have the Closer revise and resubmit to pending for re-approval.`
        : status === "pending"
          ? `PITCH MARKED PENDING (re-submitted) for ${company.name} (${companyId}) — back in the review queue for Zach.`
          : `PITCH ${status} for ${company.name} (${companyId}).`;

  // Detach the relay — do not block the response. Use a very short timeout and
  // swallow failures so the dashboard state + response are always fast.
  setTimeout(() => {
    fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: decisionMsg }),
      // Short timeout: if the supervisor is slow, don't hold the event loop.
      signal: AbortSignal.timeout(10000),
    }).catch(() => {
      /* best-effort relay; state already persisted */
    });
  }, 0);

  // CRM mirror (Phase 1): upsert the company in Comp AI CRM so the client
  // record reflects the approval state. Fire-and-forget — never blocks or
  // fails the dashboard response; a CRM outage only skips the mirror.
  if (process.env.CRM_SESSION_TOKEN) {
    const { crmUpsertCompany } = await import("@/lib/crm-client");
    setTimeout(() => {
      crmUpsertCompany({
        name: company.name,
        domain: company.website?.replace(/^https?:\/\//, "") ?? undefined,
        description: `[${company.stage}] ${company.summary ?? ""} — pitch ${status}`.trim(),
        industry: company.category,
        city: company.location?.split(",")[0]?.trim(),
        stateCode: company.location?.toLowerCase().includes("sc") ? "SC" : undefined,
        phone: company.phone,
        email: company.email,
      }).catch(() => {
        /* best-effort CRM mirror */
      });
    }, 0);
  }

  return NextResponse.json({ ok: true, action: status, relayed: true });
}
