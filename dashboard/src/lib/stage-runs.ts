/**
 * Per-company stageRun receipt — a lightweight execution record, NOT a workflow
 * engine. Each company may have at most ONE in-flight run. This records what
 * was dispatched, what evidence came back, and what Zach approved.
 *
 * Stored on the pipeline Blob under `company.stageRun`.
 */

import { mutatePipeline } from "./pipeline-store";

export type StageRunStatus =
  | "requested"
  | "completed"
  | "failed"
  | "approved";

export interface StageRun {
  runId: string;
  stage: string;
  inputRevision: string;
  requestedAt: string;
  status: StageRunStatus;
  resultDigest?: string;
  /** Evidence persisted at completion (bound to the digest). */
  artifacts?: { kind: string; version: number; contentHash: string; location: string }[];
  attestations?: { reviewerRole: string; reviewerId: string; blind: boolean; scores: Record<string, number>; verdict: "pass" | "fail"; artifactHash: string }[];
  error?: string;
  completedAt?: string;
  approvedAt?: string;
  /** Pull-queue lease (claim/lease/retry). Populated by work-queue claim. */
  claimedAt?: string;
  leaseExpiresAt?: string;
  claimedBy?: string;
  attempts?: number;
  claimedRunId?: string;
}

/** Get the current stageRun for a company (or null). */
export function getStageRun(c: any): StageRun | null {
  return c?.stageRun ?? null;
}

/**
 * Create an idempotent run receipt. Rejects an overlapping run unless
 * `replace` is true (Zach explicitly re-requests after a failure).
 */
export async function setStageRun(
  companyId: string,
  run: StageRun,
  replace = false,
): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    const c = data.companies?.find((x: any) => x.id === companyId);
    if (!c) return { code: "__NOTFOUND__" as const };
    const existing = c.stageRun;
    if (existing && !replace && existing.status === "requested") {
      return { code: "__OVERLAP__" as const };
    }
    c.stageRun = run;
    return { code: "__OK__" as const };
  });
  if (!r.ok) return { ok: false, error: r.error };
  const outcome = r.result as { code: string };
  if (outcome.code === "__NOTFOUND__") return { ok: false, error: "company not found" };
  if (outcome.code === "__OVERLAP__") return { ok: false, error: "a run is already in progress" };
  return { ok: true };
}

/** Mark a run complete with its evidence (from Hermes' completion). */
export async function completeStageRun(
  companyId: string,
  runId: string,
  status: "completed" | "failed",
  resultDigest: string,
  artifacts: { kind: string; version: number; contentHash: string; location: string }[],
  attestations: { reviewerRole: string; reviewerId: string; blind: boolean; scores: Record<string, number>; verdict: "pass" | "fail"; artifactHash: string }[],
  error?: string,
): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    const c = data.companies?.find((x: any) => x.id === companyId);
    if (!c) return { code: "__NOTFOUND__" as const };
    if (!c.stageRun || c.stageRun.runId !== runId) return { code: "__STALE__" as const };
    // Idempotency: an identical re-submission is a no-op success; a DIFFERENT
    // digest after completion is rejected (evidence for a run is final once set).
    if (c.stageRun.status === "completed" || c.stageRun.status === "approved") {
      if (c.stageRun.resultDigest === resultDigest) return { code: "__OK__" as const };
      return { code: "__CONFLICT__" as const };
    }
    c.stageRun.status = status;
    c.stageRun.resultDigest = resultDigest;
    c.stageRun.artifacts = artifacts;
    c.stageRun.attestations = attestations;
    c.stageRun.completedAt = new Date().toISOString();
    if (error) c.stageRun.error = error;
    return { code: "__OK__" as const };
  });
  if (!r.ok) return { ok: false, error: r.error };
  const outcome = r.result as { code: string };
  if (outcome.code === "__NOTFOUND__") return { ok: false, error: "company not found" };
  if (outcome.code === "__STALE__") return { ok: false, error: "run id mismatch (stale submission)" };
  if (outcome.code === "__CONFLICT__") return { ok: false, error: "run already completed with different evidence" };
  return { ok: true };
}

/** Mark a run as Zach-approved (advance does this atomically; helper for read). */
export async function approveStageRun(
  companyId: string,
  runId: string,
): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    const c = data.companies?.find((x: any) => x.id === companyId);
    if (!c) return { code: "__NOTFOUND__" as const };
    if (!c.stageRun || c.stageRun.runId !== runId) return { code: "__STALE__" as const };
    c.stageRun.status = "approved";
    c.stageRun.approvedAt = new Date().toISOString();
    return { code: "__OK__" as const };
  });
  if (!r.ok) return { ok: false, error: r.error };
  const outcome = r.result as { code: string };
  if (outcome.code === "__NOTFOUND__") return { ok: false, error: "company not found" };
  if (outcome.code === "__STALE__") return { ok: false, error: "run id mismatch (stale submission)" };
  return { ok: true };
}
