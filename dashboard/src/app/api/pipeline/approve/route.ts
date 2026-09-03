import { NextResponse } from "next/server";
import { readPipelineSafe, mutatePipeline } from "@/lib/pipeline-store";
import {
  companyEmailCandidate,
  gateEmail,
} from "@/lib/email-gate";

const RELAY_URL = `${process.env.SUPERVISOR_RELAY_URL || "http://137.184.135.50:9930"}/chat`;

/**
 * POST: approve/reject a pitch.
 * zach-approved / supervisor-approved is gated: email must pass MX
 * (dead domains blocked — prevents bounce-farm damage).
 * All writes go through mutatePipeline (ETag optimistic concurrency).
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, status, reason, suggestedFix, forceSend } = body as {
    companyId?: string;
    status?:
      | "pending"
      | "supervisor-approved"
      | "zach-approved"
      | "rejected"
      | "conditional"
      | "sent";
    reason?: string;
    suggestedFix?: string;
    forceSend?: boolean;
  };

  if (!companyId || !status) {
    return NextResponse.json({ error: "Missing companyId or status" }, { status: 400 });
  }
  if (
    !["pending", "supervisor-approved", "zach-approved", "rejected", "conditional", "sent"].includes(status)
  ) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }
  if (status === "rejected" && (!reason || !reason.trim())) {
    return NextResponse.json(
      { error: "A rejection reason is required so the pitch can be revised and resubmitted." },
      { status: 400 },
    );
  }

  // Pre-read for validation + email-gate check (read-only; the mutation below re-reads atomically).
  const pre = await readPipelineSafe();
  const preCompany = (pre?.companies ?? []).find((c: any) => c.id === companyId);
  if (!preCompany) {
    return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
  }
  if (!preCompany.pitchDraft) {
    return NextResponse.json({ error: `Company has no pitch draft: ${companyId}` }, { status: 400 });
  }

  const now = new Date().toISOString();

  // ── PRE-SEND EMAIL GATE (read-only MX check outside the mutation) ──
  let emailGate: Awaited<ReturnType<typeof gateEmail>> | null = null;
  if (status === "zach-approved" || status === "supervisor-approved") {
    const email = companyEmailCandidate(preCompany);
    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "No email on this company — cannot approve for send. Enrich email first or mark phone-only.",
          emailGate: { status: "INVALID", reason: "missing email", ok: false },
        },
        { status: 400 },
      );
    }
    emailGate = await gateEmail(email);
    if (emailGate.status === "INVALID") {
      // Bounce-risk is a real mutation → write it atomically.
      await mutatePipeline((d: any) => {
        const c = d.companies.find((x: any) => x.id === companyId);
        if (c) {
          c.emailGate = { ...emailGate, checkedAt: now };
          c.responseStatus = "bounce-risk";
        }
        return true;
      }).catch(() => {});
      return NextResponse.json(
        {
          ok: false,
          error: `Email blocked by pre-send gate: ${emailGate.email} — ${emailGate.reason}. Fix email or treat phone-only. Not approved for send.`,
          emailGate,
        },
        { status: 400 },
      );
    }
    if (emailGate.status === "UNKNOWN" && !forceSend) {
      return NextResponse.json(
        {
          ok: false,
          error: `Email MX check inconclusive (${emailGate.reason}). Retry, or forceSend:true only if you accept bounce risk.`,
          emailGate,
        },
        { status: 400 },
      );
    }
  }

  // ── Main mutation (atomic) ──
  let company: any;
  try {
    const r = await mutatePipeline((d: any) => {
      const c = d.companies.find((x: any) => x.id === companyId);
      if (!c) throw new Error("__NOTFOUND__");
      if (emailGate) c.emailGate = { ...emailGate, checkedAt: now };
      c.pitchDraft.status = status;
      if (status === "rejected") {
        c.pitchDraft.reviewFeedback = {
          reason: reason?.trim() ?? "",
          suggestedFix: suggestedFix?.trim() ?? "",
          reviewedAt: now,
        };
      } else {
        delete c.pitchDraft.reviewFeedback;
      }
      return c;
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
    }
    company = r.result;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  const draft = company.pitchDraft;
  const email = companyEmailCandidate(company) || "(no email)";
  const decisionMsg =
    status === "supervisor-approved" || status === "zach-approved"
      ? [
          `PITCH APPROVED for ${company.name} (${companyId}).`,
          `Email gate: ${emailGate?.status ?? "n/a"} — ${emailGate?.reason ?? ""}`,
          `Send ONLY via: send_pitch.py (verify+himalaya -a locallaunch)`,
          `To: ${email}`,
          `Subject: ${draft.subject ?? ""}`,
          `Body:`,
          draft.body ?? "",
          ``,
          `After send: pitchDraft.status=sent, stage=contacted, run send_truth_audit if batch.`,
        ].join("\n")
      : status === "rejected"
        ? `PITCH REJECTED for ${company.name} (${companyId}). reason="${reason}" suggestedFix="${suggestedFix}". Closer rework → pending-review.`
        : status === "pending"
          ? `PITCH MARKED PENDING for ${company.name} (${companyId}).`
          : `PITCH ${status} for ${company.name} (${companyId}).`;

  setTimeout(() => {
    fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: decisionMsg, clientId: companyId }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => {});
  }, 0);

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
      }).catch(() => {});
    }, 0);
  }

  return NextResponse.json({ ok: true, action: status, relayed: true, emailGate });
}
