import { NextResponse } from "next/server";

const RELAY_URL = "http://137.184.135.50:9930/chat";

/**
 * POST: Approve or deny a pitch. Forwards to Supervisor agent via relay.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const clientId = body?.clientId;
  const action = body?.action;
  const feedback = body?.feedback?.trim() || "";

  if (!clientId || !action) {
    return NextResponse.json({ error: "clientId and action required" }, { status: 400 });
  }

  const isApprove = action === "approve";

  const message = isApprove
    ? `APPROVE pitch for client ${clientId}. Update the playbook step "Get Zach approval and send" to done. Then send the pitch to the client.`
    : `DENY pitch for client ${clientId}. Reason: "${feedback}". Send this feedback back to the Closer agent to rework the pitch.`;

  try {
    const res = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(120000),
    });

    const data = await res.json();
    return NextResponse.json({ ok: true, action, reply: data.reply });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 502 }
    );
  }
}
