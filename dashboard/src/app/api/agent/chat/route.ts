import { NextResponse } from "next/server";

const RELAY_URL = "http://137.184.135.50:9930/chat";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = body?.message?.trim();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  try {
    const res = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(120000),
    });

    const data = await res.json();
    return NextResponse.json({ reply: data.reply });
  } catch (e: any) {
    return NextResponse.json(
      { reply: `Agent unavailable: ${e.message}. Try again.` },
      { status: 200 }
    );
  }
}
