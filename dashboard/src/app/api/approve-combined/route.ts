import { NextResponse } from "next/server";
import { readPipelineSafe, mutatePipeline } from "@/lib/pipeline-store";
import {
  companyEmailCandidate,
  gateEmail,
} from "@/lib/email-gate";
import { hashRevision } from "@/lib/revision";
import { getRelayUrl, getRelayToken } from "@/lib/relay-config";
import {
  isObject,
  badField,
  str,
  strMax,
  bool,
  optional,
  oneOf,
} from "@/lib/validate";

const RELAY_NOT_CONFIGURED = "relay not configured (HTTPS required)";
const MAX_NOTE = 4000;

/**
 * A pitch is reviewable only with a non-blank body. A status-only stub
 * (`{ status: "pending-review" }`, no body) must not trigger the email gate or
 * be treated as an in-scope pitch, so a demo-only decision is never blocked (M02).
 */
const isReviewablePitch = (pd: unknown): boolean =>
  !!pd &&
  typeof pd === "object" &&
  typeof (pd as { body?: unknown }).body === "string" &&
  (pd as { body: string }).body.trim().length > 0;

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

  // M06: strict body-shape validation before destructuring. A wrong-typed field
  // (numeric companyId, object reason, "true" forceSend) would otherwise survive
  // to `.trim()` / gate logic and throw an uncaught 500.
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object", field: "body" },
      { status: 400 },
    );
  }
  const bad = badField(body, {
    companyId: str,
    action: (v) => oneOf(v, ["approve", "reject", "rework"]),
    reason: (v) => optional(v, (x) => strMax(x, MAX_NOTE)),
    suggestedFix: (v) => optional(v, (x) => strMax(x, MAX_NOTE)),
    forceSend: (v) => optional(v, bool),
    scope: (v) => optional(v, (x) => oneOf(x, ["demo", "pitch", "both"])),
    expectedDemoUrl: (v) => optional(v, str),
    expectedPitchHash: (v) => optional(v, str),
  });
  if (bad) {
    return NextResponse.json(
      { error: `Invalid or missing field: ${bad}`, field: bad },
      { status: 400 },
    );
  }

  const {
    companyId,
    action,
    reason,
    suggestedFix,
    forceSend,
    scope,
    expectedDemoUrl,
    expectedPitchHash,
  } = body as {
    companyId?: string;
    action?: "approve" | "reject" | "rework";
    reason?: string;
    suggestedFix?: string;
    forceSend?: boolean;
    scope?: "demo" | "pitch" | "both";
    // Revision binding (H06): what the reviewer actually saw. Verified inside
    // the atomic mutation; a mismatch → HTTP 409, no write.
    expectedDemoUrl?: string;
    expectedPitchHash?: string;
  };

  if (!companyId || !action) {
    return NextResponse.json({ error: "Missing companyId or action" }, { status: 400 });
  }
  if (!["approve", "reject", "rework"].includes(action)) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }

  // Which artifact(s) this decision covers. Absent/undefined = "both" (the
  // pre-scope client behaviour, kept for backward compatibility).
  const scopeVal: "demo" | "pitch" | "both" = scope ?? "both";
  if (!["demo", "pitch", "both"].includes(scopeVal)) {
    return NextResponse.json({ error: `Invalid scope: ${scope}` }, { status: 400 });
  }
  const wantsPitch = scopeVal === "pitch" || scopeVal === "both";
  const wantsDemo = scopeVal === "demo" || scopeVal === "both";

  if ((action === "reject" || action === "rework") && (!reason || !reason.trim())) {
    return NextResponse.json(
      { error: "A reason is required so the agent knows what to fix." },
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

  // Pre-read snapshot — used only for the read-only email gate below. The
  // authoritative hadPitch / hadDemo are computed INSIDE the mutation from the
  // fresh company and gated by scope (see below).
  const preHadPitch = isReviewablePitch(preCompany.pitchDraft);
  const preHasDemoUrl = !!(preCompany.demo?.url || preCompany.demoUrl);
  const demoUrl =
    preCompany.demo?.url ??
    preCompany.demoUrl ??
    `https://${companyId}-demo.vercel.app`;

  // Per-scope validation (M02). A single-artifact decision must actually have
  // that artifact; "both" stays lenient (acts on whatever exists).
  if (scopeVal === "pitch" && !preHadPitch) {
    return NextResponse.json(
      { error: "No reviewable pitch on this company (draft has no body).", field: "scope" },
      { status: 400 },
    );
  }
  if (scopeVal === "demo" && !preHasDemoUrl) {
    return NextResponse.json(
      { error: "No demo URL on this company to act on.", field: "scope" },
      { status: 400 },
    );
  }

  // ── Pre-send MX gate (read-only, outside the mutation) ──
  // Only applies when this decision actually touches the pitch.
  let emailGate: Awaited<ReturnType<typeof gateEmail>> | null = null;
  if (action === "approve" && wantsPitch && preHadPitch) {
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
  // hadPitch / hadDemo reflect what was ACTUALLY processed: the artifact must
  // exist on the fresh company AND be in scope. Assigned inside the mutator so a
  // retried mutation (ETag conflict) recomputes them against the winning read.
  let company: any;
  let hadPitch = false;
  let hadDemo = false;
  try {
    const r = await mutatePipeline((d: any) => {
      const c = d.companies.find((x: any) => x.id === companyId);
      if (!c) throw new Error("__NOTFOUND__");
      if (emailGate) c.emailGate = { ...emailGate, checkedAt: now };

      const hasNotes = action === "reject" || action === "rework";

      hadPitch = wantsPitch && isReviewablePitch(c.pitchDraft);
      hadDemo = wantsDemo && !!(c.demoUrl || c.demo?.url);

      // ── Revision binding (H06) ──
      // Verify the artifact the reviewer saw still matches the one we're about
      // to authorize. Checked here (inside the mutator) so it races against the
      // atomic winning read, not the earlier pre-read.
      if (typeof expectedDemoUrl === "string" && expectedDemoUrl && hadDemo) {
        const currentDemoUrl = ((c.demo?.url ?? c.demoUrl) ?? "").trim();
        if (currentDemoUrl !== expectedDemoUrl.trim()) {
          throw new Error("__REVISION_CONFLICT__");
        }
      }
      if (typeof expectedPitchHash === "string" && expectedPitchHash && hadPitch) {
        const currentPitchHash = hashRevision(
          c.pitchDraft.subject,
          c.pitchDraft.body,
        );
        if (currentPitchHash !== expectedPitchHash) {
          throw new Error("__REVISION_CONFLICT__");
        }
      }

      if (hadPitch) {
        const pitch = c.pitchDraft!;
        pitch.status =
          action === "approve" ? "zach-approved" : action === "rework" ? "rework" : "rejected";
        if (hasNotes) {
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
        c.demo.status =
          action === "approve" ? "approved" : action === "rework" ? "rework" : "rejected";
        c.demo.reviewedAt = now;
        if (hasNotes) {
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

  // Label the relay message by the artifacts ACTUALLY in scope for this
  // decision, so a demo-only approval never says "Pitch: zach-approved".
  const inScope: ("pitch" | "demo")[] = [];
  if (hadPitch) inScope.push("pitch");
  if (hadDemo) inScope.push("demo");
  const scopeLabel =
    inScope.length === 2
      ? "COMBINED"
      : inScope.length === 1
        ? inScope[0].toUpperCase()
        : "NO-OP";

  const buildWorkOrderMsg = (verb: string) =>
    [
      `${scopeLabel} ${verb} — WORK ORDER FROM DASHBOARD`,
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

  const approveTitle =
    scopeLabel === "COMBINED"
      ? "COMBINED APPROVAL"
      : scopeLabel === "NO-OP"
        ? "APPROVAL — nothing in scope"
        : `${scopeLabel} APPROVED`;

  const decisionMsg =
    action === "approve"
      ? [
          `${approveTitle} — from dashboard client page.`,
          `Company: ${company.name} (id=${companyId})`,
          ...(hadPitch
            ? [
                `Pitch: zach-approved. Email gate=${emailGate?.status ?? "n/a"} (${emailGate?.reason ?? ""}). To=${companyEmailCandidate(company) || "(no email)"}. Send via send_pitch.py only.`,
              ]
            : []),
          ...(hadDemo ? [`Demo approved: ${demoUrl}`] : []),
          ...(inScope.length === 0
            ? [`No in-scope artifact existed on the company — no change made.`]
            : []),
          `Proceed per Local Launch process.`,
        ].join("\n")
      : action === "rework"
        ? buildWorkOrderMsg("REWORK")
        : buildWorkOrderMsg("REJECTION");

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
