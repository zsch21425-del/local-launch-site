/**
 * Pull-based work queue for the approve→run→evidence→advance loop.
 *
 * Replaces the fire-and-forget relay dispatch. The dashboard's `run` route only
 * PERSISTS a run receipt (status "requested"); a LOCAL executor then PULLS work
 * from this queue, claims it (lease + fencing), does the work, and submits
 * evidence. This gives at-least-once delivery with effectively-once committed
 * results — no public relay, no lost order, no double-run.
 *
 * The queue is NOT a separate store: it is the set of companies whose
 * `stageRun.status === "requested"` and whose lease (if any) has expired. This
 * keeps the pipeline Blob as the single source of truth.
 */

import { mutatePipeline, readPipelineSafe } from "./pipeline-store";
import { issueCompletionCapability, type CompletionCapability, type StageWorkOrder } from "./stage-orders";

/** How long a claim is exclusive before it can be reclaimed (long work: demo builds). */
const LEASE_MS = 1000 * 60 * 45; // 45 minutes

/** Which operation + checks each stage dispatches (mirrors the run route). */
export const STAGE_OPERATIONS: Record<
  string,
  { operation: StageWorkOrder["operation"]; checks: string[] }
> = {
  audit: { operation: "audit", checks: ["six-pass-audit"] },
  pitch: { operation: "build-demo", checks: ["visual-8.5", "blind-critic-9.5", "six-pass-audit"] },
  "quality-check": { operation: "quality-check", checks: ["visual-8.5", "blind-critic-9.5"] },
  outreach: { operation: "write-pitch", checks: ["five-pitch-standards"] },
  sale: { operation: "monthly-seo", checks: ["six-pass-audit"] },
};

export interface ClaimedWorkOrder extends StageWorkOrder {
  capability: CompletionCapability;
}

/**
 * Atomically claim the next pending work order for `workerId`.
 *
 * A work order is claimable when its company has `stageRun.status === "requested"`
 * AND its lease is absent or expired. Claiming sets a fresh lease + fencing
 * token (attempts counter) so a superseded worker's late completion is rejected.
 *
 * Returns { ok:false, idle:true } when there is no work; { ok:true, order } when
 * a work order was claimed.
 */
export async function claimNextWorkOrder(
  workerId: string,
): Promise<{ ok: boolean; idle?: boolean; error?: string; order?: ClaimedWorkOrder }> {
  const now = Date.now();

  const r = await mutatePipeline((data: any) => {
    const companies: any[] = Array.isArray(data.companies) ? data.companies : [];

    // Oldest pending run first (stable order; re-claim of expired lease re-uses the row).
    let target: any = null;
    let oldestRequestedAt = Infinity;
    for (const c of companies) {
      const run = c?.stageRun;
      if (!run || run.status !== "requested") continue;
      const leaseMs = run.leaseExpiresAt ? Date.parse(run.leaseExpiresAt) : 0;
      if (run.leaseExpiresAt && Number.isFinite(leaseMs) && leaseMs > now) continue; // leased, still live
      const reqAt = run.requestedAt ? Date.parse(run.requestedAt) : Infinity;
      if (reqAt < oldestRequestedAt) {
        oldestRequestedAt = reqAt;
        target = c;
      }
    }

    if (!target) return { code: "__IDLE__" as const };

    const run = target.stageRun;
    const attempts = (typeof run.attempts === "number" ? run.attempts : 0) + 1;
    run.claimedBy = workerId;
    run.claimedAt = new Date().toISOString();
    run.leaseExpiresAt = new Date(now + LEASE_MS).toISOString();
    run.attempts = attempts;

    // Re-issue a fresh run-bound capability (24h TTL restarts at claim time, so
    // long work never outlives its capability).
    const cap = issueCompletionCapability(
      run.runId,
      target.id,
      run.stage,
      run.inputRevision,
    );
    if (!cap) return { code: "__NOSECRET__" as const };

    const spec = STAGE_OPERATIONS[run.stage];
    if (!spec) return { code: "__NOSTAGE__" as const };

    return {
      code: "__OK__" as const,
      companyId: target.id,
      run,
      capability: cap,
      operation: spec.operation,
      checks: spec.checks,
    };
  });

  if (!r.ok) return { ok: false, error: r.error };
  const out = r.result as { code: string; [k: string]: any };
  if (out.code === "__IDLE__") return { ok: false, idle: true };
  if (out.code === "__NOSECRET__") return { ok: false, error: "completion capability unavailable (server misconfigured)" };
  if (out.code === "__NOSTAGE__") return { ok: false, error: `no run operation for stage` };

  const run = out.run;
  const callbackUrl = `${process.env.DASHBOARD_ORIGIN || "https://dashboard.locallaunchupstate.com"}/api/companies/${out.companyId}/stage/complete`;
  const order: ClaimedWorkOrder = {
    runId: run.runId,
    companyId: out.companyId,
    stage: run.stage,
    inputRevision: run.inputRevision,
    operation: out.operation,
    requiredChecks: out.checks,
    callbackUrl,
    requestedAt: run.requestedAt,
    capability: out.capability,
  };
  return { ok: true, order };
}

/**
 * Release a claim (mark the run back to "requested" with no lease) so it can be
 * reclaimed — used when an executor cannot complete the work (crash recovery).
 */
export async function releaseClaim(companyId: string, runId: string): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    const c = data.companies?.find((x: any) => x.id === companyId);
    if (!c) return { code: "__NOTFOUND__" as const };
    if (!c.stageRun || c.stageRun.runId !== runId) return { code: "__STALE__" as const };
    c.stageRun.claimedAt = undefined;
    c.stageRun.leaseExpiresAt = undefined;
    c.stageRun.claimedBy = undefined;
    return { code: "__OK__" as const };
  });
  if (!r.ok) return { ok: false, error: r.error };
  const out = r.result as { code: string };
  if (out.code === "__NOTFOUND__") return { ok: false, error: "company not found" };
  if (out.code === "__STALE__") return { ok: false, error: "run id mismatch" };
  return { ok: true };
}

/** Count pending (unclaimed / expired-lease) work orders — for the health probe. */
export async function pendingWorkCount(): Promise<number> {
  const now = Date.now();
  const data: any = await readPipelineSafe();
  const companies: any[] = Array.isArray(data.companies) ? data.companies : [];
  return companies.filter((c) => {
    const run = c?.stageRun;
    if (!run || run.status !== "requested") return false;
    if (!run.leaseExpiresAt) return true;
    const leaseMs = Date.parse(run.leaseExpiresAt);
    return !Number.isFinite(leaseMs) || leaseMs <= now;
  }).length;
}
