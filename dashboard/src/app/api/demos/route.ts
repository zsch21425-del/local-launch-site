import { NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";
import { getRelayUrl, getRelayToken } from "@/lib/relay-config";

const RELAY_NOT_CONFIGURED = "relay not configured (HTTPS required)";

/** True only for a well-formed absolute http(s) URL. Used to reject approvals
 *  that have no real, verified demo URL (no invented `<slug>-demo.vercel.app`). */
function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * GET: demos awaiting Zach's review (pending/rejected/rework).
 * Includes reviewFeedback so the UI can show why something was bounced.
 */
export async function GET() {
  const { readPipelineSafe } = await import("@/lib/pipeline-store");
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
      const raw = c.demo?.url ?? c.demoUrl ?? "";
      const explicit =
        typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : null;
      if (!explicit) {
        return {
          companyId: c.id,
          name: c.name,
          category: c.category,
          location: c.location,
          url: "",
          status: "none" as string,
          notes: null as string | null,
          reviewFeedback: null as null,
          reviewedAt: null as string | null,
        };
      }
      const CANON = ["pending", "approved", "rejected", "rework", "build-requested"];
      const rawStatus = c.demo?.status ?? "pending";
      // demo.status is canonical; rebuild-job state (verifying/dead-letter) is
      // reported separately as jobStatus (M13).
      const status: string = CANON.includes(rawStatus) ? rawStatus : "rework";
      const fb = c.demo?.reviewFeedback ?? null;
      const job = c.rebuildJob ?? null;
      return {
        companyId: c.id,
        name: c.name,
        category: c.category,
        location: c.location,
        url: explicit,
        status,
        jobStatus: job?.status ?? null,
        notes: c.demo?.notes ?? fb?.reason ?? null,
        reviewFeedback: fb,
        reviewedAt: c.demo?.reviewedAt ?? fb?.reviewedAt ?? null,
        rebuildAttempts: job?.attempts ?? c.demo?.rebuildAttempts ?? 0,
        lastError: job?.lastError ?? c.demo?.lastError ?? null,
      };
    })
    .filter((d) => d.status !== "none" && d.status !== "approved" && d.url);

  return NextResponse.json({ demos: queue });
}

/**
 * POST: approve | reject | rework a demo.
 * reject/rework REQUIRE notes (reason). suggestedFix optional.
 * Persists to Blob (atomic via mutatePipeline) + relays a full work order to the Supervisor.
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, action, notes, reason, suggestedFix, url } = body as {
    companyId?: string;
    action?: "approve" | "reject" | "rework";
    notes?: string;
    reason?: string;
    suggestedFix?: string;
    url?: string;
  };

  if (!companyId || !action) {
    return NextResponse.json(
      { error: "Missing companyId or action" },
      { status: 400 },
    );
  }
  if (!["approve", "reject", "rework"].includes(action)) {
    return NextResponse.json(
      { error: `Invalid action: ${action}` },
      { status: 400 },
    );
  }

  // Normalize feedback fields (UI may send reason or notes)
  const why = (reason || notes || "").trim();
  const fix = (suggestedFix || "").trim();

  if ((action === "reject" || action === "rework") && !why) {
    return NextResponse.json(
      {
        error:
          "A reason is required so the agent knows what to fix. Tell us what's wrong with the demo.",
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  // ── Pre-read: verify a real demo URL + short-circuit an idempotent re-approve.
  // Read-only, before the atomic mutation. We never invent a fallback URL.
  const { readPipelineSafe } = await import("@/lib/pipeline-store");
  const pre = await readPipelineSafe();
  const preCompanies: any[] = Array.isArray(pre?.companies) ? pre.companies : [];
  if (preCompanies.length === 0) {
    return NextResponse.json(
      { error: "Pipeline store empty or unreadable" },
      { status: 500 },
    );
  }
  const preCompany = preCompanies.find((x: any) => x.id === companyId);
  if (!preCompany) {
    return NextResponse.json(
      { error: `Company not found: ${companyId}` },
      { status: 404 },
    );
  }

  const bodyUrl = typeof url === "string" ? url.trim() : "";
  const storedUrl =
    (typeof preCompany.demo?.url === "string" && preCompany.demo.url.trim()) ||
    (typeof preCompany.demoUrl === "string" && preCompany.demoUrl.trim()) ||
    "";
  // The URL an approval would record: an explicit one from the request, else the
  // one already stored on the company. Never `<slug>-demo.vercel.app`.
  const verifiedUrl = bodyUrl || storedUrl;

  if (action === "approve") {
    // M13: a rebuild in flight / awaiting vision QA is not approvable yet.
    const jobStatus = preCompany.rebuildJob?.status;
    if (jobStatus === "running" || jobStatus === "verifying") {
      return NextResponse.json(
        {
          error:
            jobStatus === "verifying"
              ? "Cannot approve: this rebuild is awaiting the vision-QA pass. Clear it in verify-demo first."
              : "Cannot approve: a rebuild is currently running for this demo.",
          jobStatus,
        },
        { status: 409 },
      );
    }
    if (!isHttpUrl(verifiedUrl)) {
      return NextResponse.json(
        {
          error:
            "Cannot approve: no verified demo URL on this company. Store a real (http/https) demo URL first.",
        },
        { status: 400 },
      );
    }
    // Idempotent: this exact revision is already approved → benign success,
    // no state change and no second relay to the Supervisor.
    if (
      preCompany.demo?.status === "approved" &&
      typeof preCompany.demo?.url === "string" &&
      preCompany.demo.url.trim() === verifiedUrl
    ) {
      return NextResponse.json({
        ok: true,
        action,
        idempotent: true,
        relayed: false,
        relayError: null,
        reviewFeedback: null,
      });
    }
  }

  let company: any;
  let demoUrl = verifiedUrl || storedUrl;
  try {
    const r = await mutatePipeline((data: any) => {
      const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
      if (companies.length === 0) throw new Error("__EMPTY__");
      const c = companies.find((x: any) => x.id === companyId);
      if (!c) throw new Error("__NOTFOUND__");

      c.demo = c.demo ?? {};
      if (!c.demo.url && c.demoUrl) c.demo.url = c.demoUrl;

      if (action === "approve") {
        // Versioned demo decision ONLY. Pin the approved revision's URL and do
        // NOT advance the company stage — stage advancement belongs to explicit
        // send/response/sale events, not to a demo approval.
        c.demo.url = verifiedUrl;
        c.demo.status = "approved";
        c.demo.reviewedAt = now;
        delete c.demo.reviewFeedback;
      } else if (action === "reject" || action === "rework") {
        c.demo.status = action === "reject" ? "rejected" : "rework";
        c.demo.reviewedAt = now;
        c.demo.notes = why;
        c.demo.reviewFeedback = {
          reason: why,
          ...(fix ? { suggestedFix: fix } : {}),
          reviewedAt: now,
        };
        // Re-queue: clear all rebuild-job state (attempts/backoff/verifying/
        // dead-letter) so the worker picks it up fresh (M13). Legacy demo.*
        // failure fields are cleared too.
        delete c.rebuildJob;
        delete c.demo.rebuildAttempts;
        delete c.demo.lastError;
        delete c.demo.retryAfter;
        delete c.demo.deadLetteredAt;
      }

      c.lastUpdated = now.slice(0, 10);
      return true;
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: r.error || "writePipeline failed" },
        { status: 500 },
      );
    }
  } catch (e: any) {
    if (e?.message === "__EMPTY__")
      return NextResponse.json(
        { error: "Pipeline store empty or unreadable" },
        { status: 500 },
      );
    if (e?.message === "__NOTFOUND__")
      return NextResponse.json(
        { error: `Company not found: ${companyId}` },
        { status: 404 },
      );
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  // Re-read the company for the relay/CRM (already mutated + persisted).
  const fresh = await readPipelineSafe();
  company = (fresh?.companies ?? []).find((x: any) => x.id === companyId);

  // Full work-order message for the Supervisor (not a one-liner)
  let msg: string;
  if (action === "approve") {
    msg = [
      `DEMO APPROVED — work from dashboard (no Telegram needed for context).`,
      `Company: ${company?.name} (id=${companyId})`,
      `Demo URL: ${demoUrl || "(none on record)"}`,
      `Next: treat as Zach-approved demo. Ready for pitch/send path if email+pitch exist; otherwise note demo is cleared.`,
    ].join("\n");
  } else {
    msg = [
      `DEMO ${action.toUpperCase()} — WORK ORDER FROM DASHBOARD`,
      `Do NOT ask Zach to repeat this. Fix the demo from these notes.`,
      ``,
      `Company: ${company?.name} (id=${companyId})`,
      `Demo URL: ${demoUrl || "(none on record)"}`,
      `Stage: ${company?.stage ?? "unknown"}`,
      `Action: ${action}`,
      `Reason: ${why}`,
      fix ? `Suggested fix: ${fix}` : `Suggested fix: (none — use Reason)`,
      ``,
      `Required response:`,
      `1. Load local-launch-demo-standards + fix the demo via Claude Code /hallmark path.`,
      `2. Re-deploy, dual-viewport QA, set demo.status back to "pending" (or rework complete → pending) on Blob.`,
      `3. Reply in dashboard agent chat or leave a short note on the company when ready for Zach re-review.`,
    ].join("\n");
  }

  // Await relay so Zach gets a real "sent to agent" signal (not fire-and-forget 10s)
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
        body: JSON.stringify({ message: msg, clientId: companyId }),
        signal: AbortSignal.timeout(90000),
      });
      relayed = res.ok;
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        relayError = `relay HTTP ${res.status} ${t.slice(0, 120)}`;
      }
    } catch (e: any) {
      relayError = e?.message || "relay timeout";
    }
  }

  if (process.env.CRM_SESSION_TOKEN && company) {
    const { crmUpsertCompany } = await import("@/lib/crm-client");
    setTimeout(() => {
      crmUpsertCompany({
        name: company.name,
        domain: company.website?.replace(/^https?:\/\//, "") ?? undefined,
        description: `[${company.stage}] ${company.summary ?? ""} — demo ${action}`.trim(),
        industry: company.category,
        city: company.location?.split(",")[0]?.trim(),
        stateCode: company.location?.toLowerCase().includes("sc") ? "SC" : undefined,
        phone: company.phone,
        email: company.email,
      }).catch(() => {});
    }, 0);
  }

  return NextResponse.json({
    ok: true,
    action,
    relayed,
    relayError,
    reviewFeedback: action === "approve" ? null : company?.demo?.reviewFeedback ?? null,
  });
}
