import { NextResponse } from "next/server";
import { readPipelineSafe, mutatePipeline } from "@/lib/pipeline-store";
import {
  companyEmailCandidate,
  gateDeadPricing,
  gateEmail,
  gateScLaw,
} from "@/lib/email-gate";
import { hashRevision } from "@/lib/revision";
import { getRelayUrl, getRelayToken } from "@/lib/relay-config";

const RELAY_NOT_CONFIGURED = "relay not configured (HTTPS required)";

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

  const {
    companyId,
    status,
    reason,
    suggestedFix,
    forceSend,
    expectedDemoUrl,
    expectedPitchHash,
  } = body as {
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
    // Revision binding (H06): what the reviewer actually saw. Verified inside
    // the atomic mutation; a mismatch → HTTP 409, no write. This route only ever
    // acts on the pitch, so expectedDemoUrl is accepted but never in scope here.
    expectedDemoUrl?: string;
    expectedPitchHash?: string;
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
      // Bounce-risk is a real mutation → write it atomically. The stored gate
      // carries `emailGate.email` (M04) so it stays bound to the exact address
      // it was checked against; a later email edit invalidates it.
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

    // ── PRE-SEND CONTENT GATES (Astra audit #1, Zach-approved 2026-09-08) ──
    // Dead pricing ($300/$49/$90/tiers) + SC call/text CTA + demo-live curl.
    const draftBody = preCompany.pitchDraft?.body ?? "";
    const priceGate = gateDeadPricing(draftBody);
    if (!priceGate.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Draft blocked: ${priceGate.reason}.`,
          priceGate,
        },
        { status: 400 },
      );
    }
    const scGate = gateScLaw(draftBody, (preCompany as any).location ?? null);
    if (!scGate.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Draft blocked: ${scGate.reason}.`,
          scGate,
        },
        { status: 400 },
      );
    }
    // Demo-live curl: tier A/B drafts (no/weak site) must carry a live demo URL.
    const demoMatches: RegExpMatchArray[] = Array.from(
      draftBody.matchAll(/https?:\/\/[a-z0-9-]+\.vercel\.app[^\s)"']*/gi),
    );
    const demoUrls: string[] = Array.from(new Set(demoMatches.map((m) => m[0])));
    let demoGate: { status: string; reason: string; ok: boolean } = {
      status: "PASS",
      reason: "no demo URL in draft — tier C/D or GEO pitch, no demo required",
      ok: true,
    };
    if (demoUrls.length > 0) {
      const checked = await Promise.all(
        demoUrls.map(async (u) => {
          try {
            const r = await fetch(u, { method: "HEAD", signal: AbortSignal.timeout(15000) });
            return { url: u, ok: r.ok, status: r.status };
          } catch {
            return { url: u, ok: false, status: 0 };
          }
        }),
      );
      const dead = checked.filter((c) => !c.ok);
      demoGate =
        dead.length === 0
          ? {
              status: "PASS",
              reason: `${checked.length} demo URL(s) live`,
              ok: true,
            }
          : {
              status: "FAIL",
              reason: `demo URL(s) not live: ${dead.map((d) => `${d.url} (HTTP ${d.status})`).join(", ")} — fix demoUrl before approving`,
              ok: false,
            };
      if (dead.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: `Draft blocked: ${demoGate.reason}.`,
            demoGate,
          },
          { status: 400 },
        );
      }
    }
  }

  // ── Main mutation (atomic) ──
  let company: any;
  try {
    const r = await mutatePipeline((d: any) => {
      const c = d.companies.find((x: any) => x.id === companyId);
      if (!c) throw new Error("__NOTFOUND__");

      // ── Revision binding (H06) ──
      // The pitch is always in scope on this route. Verify it still matches what
      // the reviewer saw, here (inside the mutator) so the check races against
      // the atomic winning read rather than the earlier pre-read.
      if (typeof expectedPitchHash === "string" && expectedPitchHash && c.pitchDraft) {
        const currentPitchHash = hashRevision(
          c.pitchDraft.subject,
          c.pitchDraft.body,
        );
        if (currentPitchHash !== expectedPitchHash) {
          throw new Error("__REVISION_CONFLICT__");
        }
      }
      // expectedDemoUrl is accepted for a uniform client contract, but the demo
      // is never in scope on this pitch-only route, so it is not verified here.
      void expectedDemoUrl;

      if (emailGate) {
        const priorGate = c.emailGate;
        c.emailGate = { ...emailGate, checkedAt: now };
        // M04: a fresh passing gate for a DIFFERENT address clears a stale
        // "bounce-risk" flag that belonged to the OLD address. Only the
        // obsolete flag is removed — historical bounce evidence in
        // `reviewFeedback` / `sendTruth` is left intact.
        if (
          emailGate.ok &&
          String(c.responseStatus ?? "").toLowerCase() === "bounce-risk" &&
          (!priorGate || priorGate.email !== emailGate.email)
        ) {
          c.responseStatus = "unknown";
        }
      }
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
    if (e?.message === "__REVISION_CONFLICT__") {
      return NextResponse.json(
        {
          error:
            "The item changed since you reviewed it. Please re-review and resubmit.",
          conflict: true,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  const draft = company.pitchDraft;
  const email = companyEmailCandidate(company) || "(no email)";
  const decisionMsg =
    status === "supervisor-approved" || status === "zach-approved"
      ? [
          `PITCH APPROVED for ${company.name} (${companyId}).`,
          `Email gate: ${emailGate?.status ?? "n/a"} — ${emailGate?.reason ?? ""}`,
          `Send ONLY via: send_pitch.py (Resend branded zach@locallaunchupstate.com, SMTP fallback)`,
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

  // ── Relay the decision to the Supervisor (AWAITED — serverless kills the
  //    function after the response, so setTimeout(…, 0) never runs). Report the
  //    real outcome instead of an unconditional relayed:true. ──
  let relayed = false;
  let relayError: string | null = null;
  const relayBase = getRelayUrl();
  if (!relayBase) {
    relayError = RELAY_NOT_CONFIGURED;
  } else {
    try {
      const res = await fetch(`${relayBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Relay-Token": getRelayToken() },
        body: JSON.stringify({ message: decisionMsg, clientId: companyId }),
        signal: AbortSignal.timeout(90000),
      });
      relayed = res.ok;
      if (!res.ok) relayError = `relay HTTP ${res.status}`;
    } catch (e: any) {
      relayError = e?.message || "relay timeout";
    }
  }

  // ── CRM upsert (AWAITED, best-effort). A CRM failure must NOT fail this
  //    response, but it is reported truthfully via crmRelayed / crmError. ──
  let crmRelayed: boolean | undefined;
  let crmError: string | undefined;
  if (process.env.CRM_SESSION_TOKEN) {
    try {
      const { crmUpsertCompany } = await import("@/lib/crm-client");
      const crmId = await crmUpsertCompany({
        name: company.name,
        domain: company.website?.replace(/^https?:\/\//, "") ?? undefined,
        description: `[${company.stage}] ${company.summary ?? ""} — pitch ${status}`.trim(),
        industry: company.category,
        city: company.location?.split(",")[0]?.trim(),
        stateCode: company.location?.toLowerCase().includes("sc") ? "SC" : undefined,
        phone: company.phone,
        email: company.email,
      });
      crmRelayed = crmId !== null;
      if (!crmRelayed) crmError = "crm upsert returned null (unreachable or not persisted)";
    } catch (e: any) {
      crmRelayed = false;
      crmError = e?.message || "crm upsert failed";
    }
  }

  return NextResponse.json({
    ok: true,
    action: status,
    relayed,
    relayError,
    ...(crmRelayed !== undefined ? { crmRelayed, crmError } : {}),
    emailGate,
  });
}
