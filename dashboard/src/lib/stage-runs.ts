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
  error?: string;
  completedAt?: string;
  approvedAt?: string;
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
    if (!c) throw new Error("__NOTFOUND__");
    const existing = c.stageRun;
    if (existing && !replace && existing.status === "requested") {
      throw new Error("__OVERLAP__");
    }
    c.stageRun = run;
    return run;
  });
  if (!r.ok) {
    if (r.error === "__NOTFOUND__") return { ok: false, error: "company not found" };
    if (r.error === "__OVERLAP__") return { ok: false, error: "a run is already in progress" };
    return { ok: false, error: r.error };
  }
  return { ok: true };
}

/** Mark a run complete with its evidence digest (from Hermes' completion). */
export async function completeStageRun(
  companyId: string,
  runId: string,
  status: "completed" | "failed",
  resultDigest: string,
  error?: string,
): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    const c = data.companies?.find((x: any) => x.id === companyId);
    if (!c) throw new Error("__NOTFOUND__");
    if (!c.stageRun || c.stageRun.runId !== runId) throw new Error("__STALE__");
    c.stageRun.status = status;
    c.stageRun.resultDigest = resultDigest;
    c.stageRun.completedAt = new Date().toISOString();
    if (error) c.stageRun.error = error;
    return c.stageRun;
  });
  if (!r.ok) {
    if (r.error === "__NOTFOUND__") return { ok: false, error: "company not found" };
    if (r.error === "__STALE__") return { ok: false, error: "run id mismatch (stale submission)" };
    return { ok: false, error: r.error };
  }
  return { ok: true };
}

/** Mark a run as Zach-approved (advance does this atomically; helper for read). */
export async function approveStageRun(
  companyId: string,
  runId: string,
): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    const c = data.companies?.find((x: any) => x.id === companyId);
    if (!c) throw new Error("__NOTFOUND__");
    if (!c.stageRun || c.stageRun.runId !== runId) throw new Error("__STALE__");
    c.stageRun.status = "approved";
    c.stageRun.approvedAt = new Date().toISOString();
    return c.stageRun;
  });
  if (!r.ok) {
    if (r.error === "__NOTFOUND__") return { ok: false, error: "company not found" };
    if (r.error === "__STALE__") return { ok: false, error: "run id mismatch (stale submission)" };
    return { ok: false, error: r.error };
  }
  return { ok: true };
}
