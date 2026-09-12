import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/session";
import {
  getJob,
  setJobState,
  addArtifact,
  addReview,
  evaluateJobGates,
  legalTransition,
  type JobState,
  type Actor,
  type JobArtifact,
  type JobReview,
} from "@/lib/jobs";
import { isObject, badField, str, bool, num, oneOf } from "@/lib/validate";

/**
 * GET /api/agent/jobs/[id] — one job + its gate evaluation.
 * POST /api/agent/jobs/[id]/transition — advance state (executor/approver only).
 * POST /api/agent/jobs/[id]/artifact — register an immutable artifact version.
 * POST /api/agent/jobs/[id]/review — submit a BLIND reviewer attestation.
 * POST /api/agent/jobs/[id]/evaluate — run the deterministic gate evaluator.
 *
 * The evaluator is the ONLY thing that may set state "passed". Workers and
 * reviewers submit artifacts/attestations; they never write gate results.
 */

const JOB_STATES: JobState[] = [
  "new", "proposed", "approved", "queued", "running", "pending_QA", "repairing",
  "passed", "awaiting_human_approval", "ready_to_commit", "committing",
  "completed", "blocked", "failed", "cancelled",
];

const REVIEW_ROLES = ["ux", "product", "security", "visual", "audit"] as const;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
  const gates = evaluateJobGates(job);
  return NextResponse.json({ ok: true, job, gates });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "transition") {
    const body = await req.json().catch(() => null);
    if (!isObject(body)) {
      return NextResponse.json({ error: "Body must be a JSON object", field: "body" }, { status: 400 });
    }
    const bad = badField(body, {
      state: (v) => oneOf(v, JOB_STATES),
      actor: (v) => oneOf(v, ["zach", "executor", "worker", "reviewer", "evaluator", "system"]),
    });
    if (bad) {
      return NextResponse.json({ error: `Invalid or missing field: ${bad}`, field: bad }, { status: 400 });
    }
    const targetState = body.state as JobState;
    const actor = (body.actor as Actor) ?? "system";

    const job = await getJob(id);
    if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });

    // Enforce the transition graph. "passed" is evaluator-owned; no worker/
    // reviewer/executor may set it. This is the authority boundary Astra flagged.
    if (!legalTransition(job.state, targetState, actor)) {
      return NextResponse.json(
        {
          error: `Illegal transition ${job.state} → ${targetState} for actor "${actor}"`,
          ok: false,
        },
        { status: 403 },
      );
    }
    const r = await setJobState(id, targetState);
    if (!r.ok) return NextResponse.json({ error: r.error, ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, job: r.job });
  }

  if (action === "artifact") {
    const body = await req.json().catch(() => null);
    if (!isObject(body)) {
      return NextResponse.json({ error: "Body must be a JSON object", field: "body" }, { status: 400 });
    }
    const bad = badField(body, {
      companyId: str,
      kind: (v) => oneOf(v, ["demo", "pitch", "audit", "seo"]),
      version: num,
      contentHash: str,
      location: str,
    });
    if (bad) {
      return NextResponse.json({ error: `Invalid or missing field: ${bad}`, field: bad }, { status: 400 });
    }
    const artifact: JobArtifact = {
      id: `art-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      companyId: body.companyId as string,
      kind: body.kind as JobArtifact["kind"],
      version: body.version as number,
      contentHash: body.contentHash as string,
      location: body.location as string,
      createdAt: new Date().toISOString(),
    };
    const r = await addArtifact(id, artifact);
    if (!r.ok) return NextResponse.json({ error: r.error, ok: false }, { status: 404 });
    // Submitting an artifact moves a running job into pending_QA.
    await setJobState(id, "pending_QA").catch(() => {});
    return NextResponse.json({ ok: true, artifact });
  }

  if (action === "review") {
    const body = await req.json().catch(() => null);
    if (!isObject(body)) {
      return NextResponse.json({ error: "Body must be a JSON object", field: "body" }, { status: 400 });
    }
    const bad = badField(body, {
      reviewerId: str,
      reviewerRole: (v) => oneOf(v, REVIEW_ROLES),
      blind: bool,
      scores: (v) => isObject(v),
      verdict: (v) => oneOf(v, ["pass", "fail"]),
      notes: str,
      artifactHash: str,
    });
    if (bad) {
      return NextResponse.json({ error: `Invalid or missing field: ${bad}`, field: bad }, { status: 400 });
    }
    const review: JobReview = {
      reviewerId: body.reviewerId as string,
      reviewerRole: body.reviewerRole as JobReview["reviewerRole"],
      blind: body.blind as boolean,
      scores: body.scores as Record<string, number>,
      verdict: body.verdict as "pass" | "fail",
      notes: body.notes as string,
      artifactHash: body.artifactHash as string,
      reviewedAt: new Date().toISOString(),
    };
    const r = await addReview(id, review);
    if (!r.ok) return NextResponse.json({ error: r.error, ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, review });
  }

  if (action === "evaluate") {
    const job = await getJob(id);
    if (!job) return NextResponse.json({ error: "job not found" }, { status: 404 });
    // Evaluation is evaluator-owned and only valid from pending_QA.
    if (!legalTransition(job.state, "passed", "evaluator") && job.state !== "pending_QA") {
      return NextResponse.json(
        { error: `cannot evaluate from state "${job.state}"` },
        { status: 403 },
      );
    }
    const gates = evaluateJobGates(job);
    if (gates.passed) {
      await setJobState(id, "passed").catch(() => {});
    }
    return NextResponse.json({ ok: true, gates, passed: gates.passed });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
