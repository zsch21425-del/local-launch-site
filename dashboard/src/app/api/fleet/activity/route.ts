import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { FLEET_AGENTS } from "@/lib/fleet";
import { readPipelineSafe } from "@/lib/pipeline-store";

export const dynamic = "force-dynamic";
const IS_SERVERLESS = !!process.env.VERCEL;


/** GET /api/fleet/activity?limit=50 — reverse-chronological inter-agent activity feed
 * merged from every fleet profile's a2a_audit.jsonl. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);

  if (IS_SERVERLESS) {
    const data = await readPipelineSafe();
    const fs = data?.fleetStatus;
    return NextResponse.json({ events: (fs?.activity ?? []).slice(0, limit), fetchedAt: fs?.fetchedAt ?? null, blob: true });
  }

  const events: any[] = [];
  for (const a of FLEET_AGENTS) {
    try {
      const raw = readFileSync(`${a.home}/a2a_audit.jsonl`, "utf8");
      for (const line of raw.split("\n")) {
        const t = line.trim();
        if (!t) continue;
        try {
          const d = JSON.parse(t);
          events.push({
            ts: d.ts,
            agent: a.name,
            label: a.label,
            direction: d.direction,
            peer: d.peer,
            summary: (d.summary ?? "").slice(0, 400),
          });
        } catch {
          /* skip malformed line */
        }
      }
    } catch {
      /* no audit file for this agent */
    }
  }

  events.sort((x, y) => (y.ts ?? 0) - (x.ts ?? 0));
  return NextResponse.json({ events: events.slice(0, limit), fetchedAt: new Date().toISOString() });
}
