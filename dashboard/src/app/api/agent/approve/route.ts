import { NextResponse } from "next/server";

/**
 * RETIRED 2026-09-08 (HIGH H07).
 *
 * This endpoint accepted {clientId, action, feedback} with NO company lookup,
 * NO persistent approval record, and NO pre-send email gate, then forwarded a
 * free-text "send the pitch" instruction to the Supervisor relay. That let a
 * pitch go out with a dead/bounce-risk email and left no auditable decision on
 * the pipeline record.
 *
 * It is now a fail-closed deprecation shim: every method returns HTTP 410 Gone.
 * Callers must move to:
 *   - POST /api/approve-combined   → combined demo + pitch decisions (scope-aware, MX-gated)
 *   - POST /api/pipeline/approve   → pitch status transitions only (MX + content gated)
 */

const GONE_BODY = {
  error:
    "This endpoint is retired. Use POST /api/approve-combined for combined demo+pitch decisions, or POST /api/pipeline/approve for pitch status changes. Neither forwards an ungated 'send the pitch' instruction.",
};

export async function POST() {
  return NextResponse.json(GONE_BODY, { status: 410 });
}

export async function GET() {
  return NextResponse.json(GONE_BODY, { status: 410 });
}
