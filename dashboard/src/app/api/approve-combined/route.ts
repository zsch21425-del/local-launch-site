import { NextResponse } from "next/server";
import { readPipelineSafe, mutatePipeline } from "@/lib/pipeline-store";
import {
  companyEmailCandidate,
  gateEmail,
} from "@/lib/email-gate";

const RELAY_URL = `${process.env.SUPERVISOR_RELAY_URL || "http://137.184.135.50:9930"}/chat`;

/**
 * POST: Unified pitch + demo approval from the client page.
 * Reject REQUIRES reason. Approve-with-pitch is MX-gated.
 * Writes Blob (atomic via mutatePipeline) + relays full work order to Supervisor.
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, action, reason, suggestedFix, forceSend } = body as {
    companyId?: string;
    action?: "approve" | "reject";
    reason?: string;
    suggestedFix?: string;
    forceSend?: boolean;
  };

  if (!companyId || !action) {
    return NextResponse.json({ error: "Missing companyId or action" }, { status: 400 });
  }
  if (!["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }
  if (action === "reject" && (!reason || !reason.trim())) {
    return NextResponse.json(
      { error: "A rejection reason is required so the agent knows what to fix." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const why = reason?.trim() ?? "";
  const fix = suggestedFix?.trim() ?? "";

  // Pre-read for validation + email-gate check (read-only).
  const pre = await readPipelineSafe();
  const preCompany = (pre?.companies ?? []).find((c: any) => c.id === companyId);
  if (!preCompany) {
    return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
  }

  const hadPitch = !!preCompany.pitchDraft;
  const hadDemo = !!(preCompany.demoUrl || preCompany.demo?.url);
  const demoUrl =
    preCompany.demo?.url ??
    preCompany.demoUrl ??
    `https://${companyId}-demo.vercel.app`;

  // ── Pre-send MX gate (read-only, outside the mutation) ──
  let emailGate: Awaited<ReturnType<typeof gateEmail>> | null = null;
  if (action === "approve" && hadPitch) {
    const email = companyEmailCandidate(preCompany);
    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "No email on file — cannot approve pitch for send. Enrich email or phone-only.",
        },
        { status: 400 },
      );
    }
    emailGate = await gateEmail(email);
    if (emailGate.status === "INVALID") {
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
          error: `Email blocked: ${emailGate.email} — ${emailGate.reason}. Not approved for send.`,
          emailGate,
        },
        { status: 400 },
      );
    }
    if (emailGate.status === "UNKNOWN" && !forceSend) {
      return NextResponse.json(
        {
          ok: false,
          error: `Email MX inconclusive (${emailGate.reason}). Retry or forceSend:true.`,
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

      if (hadPitch) {
        const pitch = c.pitchDraft!;
        pitch.status = action === "approve" ? "zach-approved" : "rejected";
        if (action === "reject") {
          pitch.reviewFeedback = {
            reason: why,
            ...(fix ? { suggestedFix: fix } : {}),
            reviewedAt: now,
          };
        } else {
          delete pitch.reviewFeedback;
        }
      }

      if (hadDemo) {
        c.demo = c.demo ?? {};
        if (!c.demo.url && c.demoUrl) c.demo.url = c.demoUrl;
        c.demo.status = action === "approve" ? "approved" : "rejected";
        c.demo.reviewedAt = now;
        if (action === "reject") {
          c.demo.notes = why;
          c.demo.reviewFeedback = {
            reason: why,
            ...(fix ? { suggestedFix: fix } : {}),
            reviewedAt: now,
          };
        } else {
          delete c.demo.reviewFeedback;
        }
      }

      c.lastUpdated = now.slice(0, 10);
      return c;
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error || "writePipeline failed" }, { status: 500 });
    }
    company = r.result;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  const decisionMsg =
    action === "approve"
      ? [
          `COMBINED APPROVAL — from dashboard client page.`,
          `Company: ${company.name} (id=${companyId})`,
          hadPitch
            ? `Pitch: zach-approved. Email gate=${emailGate?.status ?? "n/a"} (${emailGate?.reason ?? ""}). To=${companyEmailCandidate(company) || "(no email)"}. Send via send_pitch.py only.`
            : `Pitch: none.`,
          hadDemo ? `Demo approved: ${demoUrl}` : `Demo: none.`,
          `Proceed per Local Launch process.`,
        ].join("\n")
      : [
          `COMBINED REJECTION — WORK ORDER FROM DASHBOARD`,
          `Do NOT ask Zach to repeat this. Fix from these notes.`,
          ``,
          `Company: ${company.name} (id=${companyId})`,
          `Demo URL: ${hadDemo ? demoUrl : "(no demo)"}`,
          `Had pitch: ${hadPitch} · Had demo: ${hadDemo}`,
          `Reason: ${why}`,
          fix ? `Suggested fix: ${fix}` : `Suggested fix: (none — use Reason)`,
          ``,
          `Required:`,
          hadDemo
            ? `1. Rework demo (Claude Code /hallmark). Re-deploy + dual-viewport QA. Set demo.status=pending when ready.`
            : `1. (no demo)`,
          hadPitch
            ? `2. Rework pitch body. Set pitchDraft.status=pending-review when ready.`
            : `2. (no pitch)`,
          `3. Leave short note / agent chat when ready for Zach re-review.`,
        ].join("\n");

  let relayed = false;
  let relayError: string | null = null;
  try {
    const res = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: decisionMsg, clientId: companyId }),
      signal: AbortSignal.timeout(90000),
    });
    relayed = res.ok;
    if (!res.ok) relayError = `relay HTTP ${res.status}`;
  } catch (e: any) {
    relayError = e?.message || "relay timeout";
  }

  return NextResponse.json({
    ok: true,
    action,
    hadPitch,
    hadDemo,
    relayed,
    relayError,
    emailGate,
  });
}
