import { NextResponse } from "next/server";
import { mutatePipeline, readPipelineSafe } from "@/lib/pipeline-store";
import { getRelayUrl, getRelayToken } from "@/lib/relay-config";

const RELAY_NOT_CONFIGURED = "relay not configured (HTTPS required)";

/**
 * POST /api/pipeline/build-demo
 * Greenlight building a NEW demo for a prospect (no demo exists yet).
 * Sets `demo.status = "build-requested"` and relays a build work order to the
 * Supervisor (Claude Code /hallmark). Mirrors approve-combined's relay + atomic
 * mutatePipeline patterns.
 */
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { companyId, notes } = body as { companyId?: string; notes?: string };
  if (!companyId) {
    return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const note = (notes ?? "").trim();

  const pre = await readPipelineSafe();
  const preCompany = (pre?.companies ?? []).find((c: any) => c.id === companyId);
  if (!preCompany) {
    return NextResponse.json({ error: `Company not found: ${companyId}` }, { status: 404 });
  }

  const resolveDemoUrl = (c: any): string =>
    String(c?.demo?.url ?? c?.demoUrl ?? "").trim();

  // Idempotency (H09): never clobber an existing demo URL or an in-flight
  // request. A repeat tap is a benign no-op, not a re-request / re-relay.
  if (resolveDemoUrl(preCompany)) {
    return NextResponse.json({
      ok: true,
      alreadyExists: true,
      relayed: false,
      demoUrl: resolveDemoUrl(preCompany),
      message: "Demo already exists — not re-requested.",
    });
  }
  if (preCompany.demo?.status === "build-requested") {
    return NextResponse.json({
      ok: true,
      alreadyRequested: true,
      relayed: false,
      message: "Build already requested — agent not re-notified.",
    });
  }

  let company: any;
  let skipRelay = false;
  try {
    const r = await mutatePipeline((d: any) => {
      const c = d.companies.find((x: any) => x.id === companyId);
      if (!c) throw new Error("__NOTFOUND__");
      // Re-check under the atomic read (guards a concurrent request).
      if (resolveDemoUrl(c) || c.demo?.status === "build-requested") {
        skipRelay = true;
        return c;
      }
      c.demo = { ...(c.demo ?? {}), status: "build-requested" };
      if (note) c.demo.notes = note;
      c.lastUpdated = now.slice(0, 10);
      return c;
    });
    if (!r.ok) {
      return NextResponse.json({ error: r.error || "write failed" }, { status: 500 });
    }
    company = r.result;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }

  if (skipRelay) {
    return NextResponse.json({
      ok: true,
      alreadyRequested: true,
      relayed: false,
      message: "Build already requested — agent not re-notified.",
    });
  }

  const workOrder = [
    `BUILD DEMO — WORK ORDER FROM DASHBOARD`,
    `Do NOT ask Zach to repeat this. Build from this order.`,
    ``,
    `Company: ${company.name} (id=${companyId})`,
    `Category: ${company.category || "n/a"} · Location: ${company.location || "n/a"}`,
    `Website: ${company.website || "(none)"} · Owner: ${company.ownerName || "(unknown)"}`,
    `Phone: ${company.phone || "(none)"}`,
    note ? `Notes: ${note}` : `Notes: (none — build per standard /hallmark template)`,
    ``,
    `Required:`,
    `1. Build a demo site with Claude Code /hallmark. Deploy + dual-viewport QA.`,
    `2. Set demo.url = https://<slug>-demo.vercel.app and demo.status = "pending" when ready.`,
    `3. Leave a short note / agent chat when ready for Zach's review.`,
  ].join("\n");

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
        body: JSON.stringify({ message: workOrder, clientId: companyId }),
        signal: AbortSignal.timeout(90000),
      });
      relayed = res.ok;
      if (!res.ok) relayError = `relay HTTP ${res.status}`;
    } catch (e: any) {
      relayError = e?.message || "relay timeout";
    }
  }

  return NextResponse.json({ ok: true, relayed, relayError });
}
