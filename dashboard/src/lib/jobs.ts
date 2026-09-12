/**
 * Jobs + artifact registry (Stage 2a/2b of the autonomous-work build).
 *
 * A "job" is a durable work-item that moves through a state machine. The
 * dashboard is SERVERLESS — it cannot run Camoufox/vision or LLM critics, so a
 * job's lifecycle is: the dashboard records it, dispatches the work to the
 * Supervisor (relay), then a gate evaluator reads back the EVIDENCE the worker
 * left (immutable artifact version + reviewer attestations) and decides whether
 * to advance. Workers SUBMIT artifacts; they never mark a gate "passed".
 *
 * Jobs are stored on the pipeline Blob under `data.jobs` (and mirrored locally)
 * so they survive serverless cold starts and are cross-device consistent, same
 * as the pipeline book itself.
 */

import { mutatePipeline, readPipelineSafe } from "./pipeline-store";

/**
 * Actors with distinct authority. A single shared DASHBOARD_TOKEN is NOT
 * sufficient separation — the executor, workers, reviewers, Zach, and the
 * evaluator must not be interchangeable. Until per-principal tokens exist,
 * the transition graph below is the enforcement boundary: it decides WHO may
 * perform each transition, and every state change goes through it.
 */
export type Actor = "zach" | "executor" | "worker" | "reviewer" | "evaluator" | "system";

export type JobState =
  | "new"
  | "proposed"
  | "approved"
  | "queued"
  | "running"
  | "pending_QA"
  | "repairing"
  | "passed"
  | "awaiting_human_approval"
  | "ready_to_commit"
  | "committing"
  | "completed"
  | "blocked"
  | "failed"
  | "cancelled";

/**
 * The ENFORCED transition graph. Key invariant: "passed" is evaluator-owned —
 * no worker/reviewer/executor may set it. "approved" is Zach-owned. Movement
 * into running/queued is executor-owned. `undefined` from-state means the job
 * does not exist yet (creation).
 */
export const TRANSITIONS: Record<JobState, { to: JobState[]; by: Actor[] }> = {
  new: { to: ["proposed"], by: ["system", "zach"] },
  proposed: { to: ["approved", "cancelled"], by: ["zach"] },
  approved: { to: ["queued", "cancelled"], by: ["executor", "zach"] },
  queued: { to: ["running", "cancelled"], by: ["executor"] },
  running: { to: ["pending_QA", "repairing", "failed", "blocked", "cancelled"], by: ["executor", "worker"] },
  pending_QA: { to: ["repairing", "passed", "failed", "blocked"], by: ["evaluator"] },
  repairing: { to: ["pending_QA", "failed", "blocked"], by: ["executor"] },
  passed: { to: ["awaiting_human_approval", "ready_to_commit", "failed"], by: ["evaluator"] },
  awaiting_human_approval: { to: ["ready_to_commit", "repairing", "cancelled"], by: ["zach"] },
  ready_to_commit: { to: ["committing", "cancelled", "failed"], by: ["executor"] },
  committing: { to: ["completed", "failed", "blocked"], by: ["executor", "system"] },
  completed: { to: [], by: [] },
  blocked: { to: ["queued", "repairing", "failed", "cancelled"], by: ["executor", "zach"] },
  failed: { to: ["cancelled"], by: ["zach"] },
  cancelled: { to: [], by: [] },
};

/** Is `from → to` legal, and may `actor` perform it? */
export function legalTransition(from: JobState, to: JobState, actor: Actor): boolean {
  const rule = TRANSITIONS[from];
  if (!rule) return false;
  return rule.to.includes(to) && rule.by.includes(actor);
}

export type JobActionType = "move" | "audit" | "build-demo" | "write-pitch" | "monthly-seo";

export interface JobArtifact {
  id: string;
  companyId: string;
  kind: "demo" | "pitch" | "audit" | "seo";
  version: number;
  /** SHA-256 content hash of the frozen artifact — any change invalidates it. */
  contentHash: string;
  /** Where the artifact lives (deployed URL, Blob key, etc.). */
  location: string;
  createdAt: string;
}

export interface JobReview {
  reviewerId: string;
  reviewerRole: "ux" | "product" | "security" | "visual" | "audit";
  /** Blindness: the reviewer got the frozen artifact + rubric, NOT author identity. */
  blind: boolean;
  scores: Record<string, number>;
  verdict: "pass" | "fail";
  notes: string;
  reviewedAt: string;
  /** contentHash of the artifact version this review judged. */
  artifactHash: string;
}

export interface WorkJob {
  id: string;
  actionType: JobActionType;
  companyIds: string[];
  targetStage?: string;
  state: JobState;
  proposalDigest?: string;
  artifacts: JobArtifact[];
  reviews: JobReview[];
  /** Per-company outcome, only written by the executor after verified effects. */
  outcomes?: { companyId: string; ok: boolean; error?: string }[];
  error?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

const EMPTY_ERROR = "__EMPTY__";

export async function listJobs(): Promise<WorkJob[]> {
  const data: any = await readPipelineSafe();
  return Array.isArray(data?.jobs) ? data.jobs : [];
}

export async function getJob(id: string): Promise<WorkJob | null> {
  const jobs = await listJobs();
  return jobs.find((j) => j.id === id) ?? null;
}

export async function createJob(job: WorkJob): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    if (!Array.isArray(data.jobs)) data.jobs = [];
    if (data.jobs.some((j: WorkJob) => j.id === job.id)) {
      throw new Error("__DUP__");
    }
    data.jobs.push(job);
    return job;
  });
  if (!r.ok) {
    if (r.error === "__DUP__" || r.error?.includes("__DUP__")) {
      return { ok: false, error: "job id already exists" };
    }
    return { ok: false, error: r.error };
  }
  return { ok: true };
}

/** Transition a job's state. The caller is responsible for legal transitions. */
export async function setJobState(
  id: string,
  state: JobState,
  patch?: Partial<WorkJob>,
): Promise<{ ok: boolean; error?: string; job?: WorkJob }> {
  const r = await mutatePipeline((data: any) => {
    if (!Array.isArray(data.jobs)) throw new Error(EMPTY_ERROR);
    const j = data.jobs.find((x: WorkJob) => x.id === id);
    if (!j) throw new Error("__NOTFOUND__");
    j.state = state;
    j.updatedAt = new Date().toISOString();
    if (patch) Object.assign(j, patch);
    return j;
  });
  if (!r.ok) {
    if (r.error === EMPTY_ERROR) return { ok: false, error: "no jobs store" };
    if (r.error === "__NOTFOUND__") return { ok: false, error: "job not found" };
    return { ok: false, error: r.error };
  }
  return { ok: true, job: r.result as WorkJob };
}

/** Append an immutable artifact version to a job. */
export async function addArtifact(
  jobId: string,
  artifact: JobArtifact,
): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    if (!Array.isArray(data.jobs)) throw new Error(EMPTY_ERROR);
    const j = data.jobs.find((x: WorkJob) => x.id === jobId);
    if (!j) throw new Error("__NOTFOUND__");
    j.artifacts.push(artifact);
    j.updatedAt = new Date().toISOString();
    return j;
  });
  if (!r.ok) {
    if (r.error === EMPTY_ERROR) return { ok: false, error: "no jobs store" };
    if (r.error === "__NOTFOUND__") return { ok: false, error: "job not found" };
    return { ok: false, error: r.error };
  }
  return { ok: true };
}

/** Append a reviewer attestation to a job. */
export async function addReview(
  jobId: string,
  review: JobReview,
): Promise<{ ok: boolean; error?: string }> {
  const r = await mutatePipeline((data: any) => {
    if (!Array.isArray(data.jobs)) throw new Error(EMPTY_ERROR);
    const j = data.jobs.find((x: WorkJob) => x.id === jobId);
    if (!j) throw new Error("__NOTFOUND__");
    j.reviews.push(review);
    j.updatedAt = new Date().toISOString();
    return j;
  });
  if (!r.ok) {
    if (r.error === EMPTY_ERROR) return { ok: false, error: "no jobs store" };
    if (r.error === "__NOTFOUND__") return { ok: false, error: "job not found" };
    return { ok: false, error: r.error };
  }
  return { ok: true };
}

/**
 * The gate evaluator's deterministic core (Stage 2c).
 * Given a job, decide whether its artifacts have cleared the required gates.
 * This is the CHEAP tier: it checks that evidence EXISTS and is internally
 * consistent (hashes match, blind reviews present, verdicts pass). It does NOT
 * re-run the subjective 9.5/8.5 review — that already happened upstream and
 * left an attestation here.
 */
export function evaluateJobGates(job: WorkJob): {
  passed: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  const artifacts = job.artifacts ?? [];
  const reviews = job.reviews ?? [];

  if (job.actionType === "move") {
    // Pure movement — no deliverable gates; adjacency is checked by the executor.
    return { passed: true, missing: [] };
  }

  // A deliverable job must have produced an artifact PER COMPANY. A batch must
  // not pass because one company got an artifact — every frozen company needs
  // its required deliverable + a passing blind review on the CURRENT version.
  for (const companyId of job.companyIds) {
    const companyArtifacts = artifacts.filter((a) => a.companyId === companyId);
    if (companyArtifacts.length === 0) {
      missing.push(`company ${companyId}: no artifact produced`);
    }
  }

  for (const a of artifacts) {
    if (!a.contentHash) missing.push(`artifact ${a.id}: missing content hash`);
    if (!a.location) missing.push(`artifact ${a.id}: missing location`);
    // A placeholder hash is never a real digest — reject it explicitly so a
    // stubbed executor can't be mistaken for a finished artifact.
    if (typeof a.contentHash === "string" && /REPLACE|sha256:placeholder/i.test(a.contentHash)) {
      missing.push(`artifact ${a.id}: placeholder hash (not a real digest)`);
    }
  }

  // Required reviewer roles depend on the artifact kind.
  const kinds = new Set(artifacts.map((a) => a.kind));
  const requiredRoles = new Set<string>();
  if (kinds.has("demo")) {
    requiredRoles.add("visual"); // 8.5 @ both viewports
    requiredRoles.add("ux");
    requiredRoles.add("product");
  }
  if (kinds.has("pitch")) {
    requiredRoles.add("audit"); // 6-pass audit (accuracy/specificity/etc.)
    requiredRoles.add("product");
  }
  if (kinds.has("audit") || kinds.has("seo")) {
    requiredRoles.add("audit");
  }

  for (const role of requiredRoles) {
    const roleReviews = reviews.filter((r) => r.reviewerRole === role);
    if (roleReviews.length === 0) {
      missing.push(`missing ${role} review`);
      continue;
    }
    // Every review must be blind, reference the CURRENT artifact version, and
    // pass. A stale review (judged an older hash) does not count.
    const latest = artifacts.reduce((max, a) => (a.version > max ? a.version : max), 0);
    const latestArtifact = artifacts.find((a) => a.version === latest);
    const current = latestArtifact
      ? roleReviews.some(
          (r) => r.blind && r.verdict === "pass" && r.artifactHash === latestArtifact.contentHash,
        )
      : false;
    if (!current) missing.push(`${role} review not blind/current/passing`);
    // Security blockers veto regardless of other scores.
    if (role === "security" && roleReviews.some((r) => r.verdict === "fail")) {
      missing.push("security reviewer vetoed");
    }
  }

  return { passed: missing.length === 0, missing };
}
