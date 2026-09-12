import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/session";
import { claimNextWorkOrder, releaseClaim } from "@/lib/work-queue";

/**
 * POST /api/work-queue/claim  — the LOCAL executor pulls the next pending work
 * order here, atomically claiming it (lease + fencing). Machine-authed via
 * `Authorization: Bearer <DASHBOARD_TOKEN>`.
 *
 * Body: { workerId?: string, action?: "claim" | "release", companyId?, runId? }
 *   - action "claim" (default) → { ok, order } or { ok:false, idle:true }
 *   - action "release" → clears the claim so the run is reclaimable (crash recovery)
 *
 * This replaces the fire-and-forget relay dispatch: delivery is now PULL, not
 * push, so a work order cannot be lost to a relay timeout.
 */
export async function POST(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null) ?? {};
  const workerId = typeof body.workerId === "string" && body.workerId ? body.workerId : "local-executor";

  if (body.action === "release") {
    if (typeof body.companyId !== "string" || typeof body.runId !== "string") {
      return NextResponse.json({ error: "companyId and runId required for release" }, { status: 400 });
    }
    const rel = await releaseClaim(body.companyId, body.runId);
    if (!rel.ok) return NextResponse.json({ error: rel.error, ok: false }, { status: 409 });
    return NextResponse.json({ ok: true, released: true });
  }

  const res = await claimNextWorkOrder(workerId);
  if (!res.ok) {
    if (res.idle) return NextResponse.json({ ok: true, idle: true });
    return NextResponse.json({ error: res.error, ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, order: res.order });
}
