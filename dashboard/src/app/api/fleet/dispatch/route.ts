import { NextResponse } from "next/server";
import { FLEET_AGENTS } from "@/lib/fleet";
import { a2aSend } from "@/lib/a2a";

export const dynamic = "force-dynamic";
const IS_SERVERLESS = !!process.env.VERCEL;


/** POST /api/fleet/dispatch {agent, message} — send a task to a fleet agent via A2A. */
export async function POST(request: Request) {
  if (IS_SERVERLESS) {
    return NextResponse.json({ error: "Fleet dispatch is local-only" }, { status: 503 });
  }
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { agent, message } = body as { agent?: string; message?: string };
  if (!agent || !message?.trim()) {
    return NextResponse.json({ error: "agent and message are required" }, { status: 400 });
  }

  const target = FLEET_AGENTS.find((a) => a.name === agent);
  if (!target) {
    return NextResponse.json({ error: `Unknown agent: ${agent}` }, { status: 404 });
  }

  const reply = await a2aSend(target, message.trim(), 120000);
  return NextResponse.json({
    ok: reply.ok,
    agent: target.name,
    label: target.label,
    reply: reply.text,
    error: reply.error ?? null,
  });
}
