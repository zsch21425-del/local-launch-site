import { NextResponse } from "next/server";
import { mutatePipeline } from "@/lib/pipeline-store";

const RELAY_URL = `${process.env.SUPERVISOR_RELAY_URL || "http://137.184.135.50:9930"}/chat`;

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
      const status: string = c.demo?.status ?? "pending";
      const fb = c.demo?.reviewFeedback ?? null;
      return {
        companyId: c.id,
        name: c.name,
        category: c.category,
        location: c.location,
        url: explicit,
        status,
        notes: c.demo?.notes ?? fb?.reason ?? null,
        reviewFeedback: fb,
        reviewedAt: c.demo?.reviewedAt ?? fb?.reviewedAt ?? null,
        rebuildAttempts: c.demo?.rebuildAttempts ?? 0,
        lastError: c.demo?.lastError ?? null,
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

  const { companyId, action, notes, reason, suggestedFix } = body as {
    companyId?: string;
    action?: "approve" | "reject" | "rework";
    notes?: string;
    reason?: string;
    suggestedFix?: string;
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

  let company: any;
  let demoUrl = "";
  try {
    const r = await mutatePipeline((data: any) => {
      const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
      if (companies.length === 0) throw new Error("__EMPTY__");
      const c = companies.find((x: any) => x.id === companyId);
      if (!c) throw new Error("__NOTFOUND__");

      demoUrl =
        c.demo?.url || c.demoUrl || `https://${companyId}-demo.vercel.app`;

      c.demo = c.demo ?? {};
      if (!c.demo.url && c.demoUrl) c.demo.url = c.demoUrl;

      if (action === "approve") {
        c.demo.status = "approved";
        c.demo.reviewedAt = now;
        delete c.demo.reviewFeedback;
        // Demo cleared → advance the company one stage toward outreach/pitch.
        const order = [
          "prospect",
          "audit",
          "pitch",
          "contacted",
          "response",
          "build-launch",
        ];
        const idx = order.indexOf(c.stage);
        if (idx >= 0 && idx < order.length - 1) {
          c.stage = order[idx + 1];
          c.stageMovedAt = now;
        }
      } else if (action === "reject" || action === "rework") {
        c.demo.status = action === "reject" ? "rejected" : "rework";
        c.demo.reviewedAt = now;
        c.demo.notes = why;
        c.demo.reviewFeedback = {
          reason: why,
          ...(fix ? { suggestedFix: fix } : {}),
          reviewedAt: now,
        };
        // Re-queue: reset the rebuild failure state (attempts/backoff/dead-letter)
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
  const { readPipelineSafe } = await import("@/lib/pipeline-store");
  const fresh = await readPipelineSafe();
  company = (fresh?.companies ?? []).find((x: any) => x.id === companyId);

  // Full work-order message for the Supervisor (not a one-liner)
  let msg: string;
  if (action === "approve") {
    msg = [
      `DEMO APPROVED — work from dashboard (no Telegram needed for context).`,
      `Company: ${company?.name} (id=${companyId})`,
      `Demo URL: ${demoUrl}`,
      `Next: treat as Zach-approved demo. Ready for pitch/send path if email+pitch exist; otherwise note demo is cleared.`,
    ].join("\n");
  } else {
    msg = [
      `DEMO ${action.toUpperCase()} — WORK ORDER FROM DASHBOARD`,
      `Do NOT ask Zach to repeat this. Fix the demo from these notes.`,
      ``,
      `Company: ${company?.name} (id=${companyId})`,
      `Demo URL: ${demoUrl}`,
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
  try {
    const res = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
