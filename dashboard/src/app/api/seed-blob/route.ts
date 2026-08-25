// One-shot Phase 1 seed endpoint. DELETE THIS FILE after Phase 1 is green.
// POST /api/seed-blob — auth-gated, body: {"snapshotPath":"/tmp/llos-live.json"}
//   1) reads live snapshot from disk
//   2) aborts unless companies.length == 264 and demoUrl count == 31
//   3) backs up current Blob to /tmp/blob-backup-YYYYMMDD.json (only if Blob has data)
//   4) calls writePipeline(store)
//   5) re-reads and asserts the same numbers
//   6) returns JSON report
import { NextRequest, NextResponse } from "next/server";
import * as fs from "node:fs";
import { readPipelineSafe, writePipeline } from "@/lib/pipeline-store";

const ACCESS = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN;

function isAuthed(req: NextRequest) {
  const c = req.cookies.get("ll_dash_auth")?.value;
  return c === ACCESS;
}

function checkStatus() {
  return {
    VERCEL: !!process.env.VERCEL,
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
  };
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  let live: any;
  if (body && typeof body.snapshot === "object") {
    // inline snapshot (works on serverless where /tmp is per-instance)
    live = body.snapshot;
  } else {
    const snapPath = body.snapshotPath || "/tmp/llos-live.json";
    if (!fs.existsSync(snapPath)) {
      return NextResponse.json({ error: `snapshot not found: ${snapPath}` }, { status: 400 });
    }
    live = JSON.parse(fs.readFileSync(snapPath, "utf-8"));
  }
  const cos = live.companies || [];
  const nCos = cos.length;
  const nDemo = cos.filter((x: any) => x.demoUrl).length;

  if (nCos !== 264) {
    return NextResponse.json(
      { error: "ABORT live != 264", live_companies: nCos, live_demos: nDemo, env: checkStatus() },
      { status: 400 },
    );
  }
  if (nDemo !== 31) {
    return NextResponse.json(
      { error: "ABORT live demoUrl != 31", live_companies: nCos, live_demos: nDemo },
      { status: 400 },
    );
  }

  // Build the store object the existing readPipelineSafe consumers expect.
  const store = {
    agency: live.agency || {},
    pipeline: {
      stages: live.stages || live.pipeline?.stages || [],
    },
    companies: cos,
    carLotsPipeline: live.carLotsPipeline || { cars: [] },
    revenue: live.revenue || {},
  };

  // Backup current Blob if it has data.
  let backup: { path: string; companies: number } | null = null;
  const cur = await readPipelineSafe();
  if (cur && Array.isArray(cur.companies) && cur.companies.length > 0) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const p = `/tmp/blob-backup-${stamp}.json`;
    fs.writeFileSync(p, JSON.stringify(cur, null, 2));
    backup = { path: p, companies: cur.companies.length };
  }

  const w = await writePipeline(store);
  if (!w.ok) {
    return NextResponse.json({ error: "writePipeline failed", detail: w.error, env: checkStatus() }, { status: 500 });
  }

  // Verify
  const after = await readPipelineSafe();
  const nAfter = (after.companies || []).length;
  const dAfter = (after.companies || []).filter((x: any) => x.demoUrl).length;
  const ok = nAfter === 264 && dAfter === 31;

  return NextResponse.json({
    ok,
    env: checkStatus(),
    before: { live_companies: nCos, live_demos: nDemo },
    backup,
    after: { blob_companies: nAfter, blob_demos: dAfter },
    write: w,
  });
}

export async function GET(req: NextRequest) {
  // status endpoint — does NOT write, just reports env + current Blob counts
  if (!isAuthed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const cur = await readPipelineSafe();
  return NextResponse.json({
    env: checkStatus(),
    blob_companies: (cur.companies || []).length,
    blob_demos: (cur.companies || []).filter((x: any) => x.demoUrl).length,
  });
}
