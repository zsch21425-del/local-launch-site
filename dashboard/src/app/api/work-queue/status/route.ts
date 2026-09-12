import { NextRequest, NextResponse } from "next/server";
import { isRequestAuthed } from "@/lib/session";
import { pendingWorkCount } from "@/lib/work-queue";

/**
 * GET /api/work-queue/status — how many work orders are pending (unclaimed or
 * expired-lease). Used by the executor's health probe + the dashboard fleet chip.
 * Machine-authed.
 */
export async function GET(req: NextRequest) {
  if (!(await isRequestAuthed(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const pending = await pendingWorkCount();
  return NextResponse.json({ ok: true, pending });
}
