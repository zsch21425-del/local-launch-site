import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/session";
import { listJobs, createJob, type WorkJob, type JobState, type JobActionType } from "@/lib/jobs";
import { isObject, badField, str, optional, oneOf } from "@/lib/validate";

const JOB_STATES: JobState[] = [
  "new",
  "proposed",
  "approved",
  "queued",
  "running",
  "pending_QA",
  "repairing",
  "passed",
  "awaiting_human_approval",
  "ready_to_commit",
  "committing",
  "completed",
  "blocked",
  "failed",
  "cancelled",
];

const JOB_ACTIONS: JobActionType[] = ["move", "audit", "build-demo", "write-pitch", "monthly-seo"];

/** GET /api/agent/jobs — list durable work jobs (newest first). */
export async function GET(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const jobs = await listJobs();
  jobs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ ok: true, jobs });
}

/** POST /api/agent/jobs — create a typed, immutable proposal job (state "proposed"). */
export async function POST(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!isObject(body)) {
    return NextResponse.json({ error: "Body must be a JSON object", field: "body" }, { status: 400 });
  }
  const bad = badField(body, {
    actionType: (v) => oneOf(v, JOB_ACTIONS),
    companyIds: (v) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string"),
    targetStage: (v) => optional(v, str),
  });
  if (bad) {
    return NextResponse.json({ error: `Invalid or missing field: ${bad}`, field: bad }, { status: 400 });
  }

  const now = new Date().toISOString();
  const job: WorkJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actionType: body.actionType as JobActionType,
    companyIds: Array.from(new Set(body.companyIds as string[])),
    targetStage: body.targetStage ? (body.targetStage as string).trim() : undefined,
    state: "proposed",
    artifacts: [],
    reviews: [],
    createdAt: now,
    updatedAt: now,
  };
  const r = await createJob(job);
  if (!r.ok) {
    return NextResponse.json({ error: r.error, ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, job });
}
