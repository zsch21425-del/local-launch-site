import { NextResponse } from "next/server";
import { readPipelineSafe } from "@/lib/pipeline-store";
import { getRelayUrl, getRelayToken } from "@/lib/relay-config";
import { isObject, badField, str, optional } from "@/lib/validate";

const RELAY_NOT_CONFIGURED = "relay not configured (HTTPS required)";

/**
 * POST /api/agent/chat
 * Forwards to the droplet relay → supervisor tunnel.
 * Includes clientId context so the agent knows which company Zach is on.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  // M06: a numeric `message` would throw on `.trim()` below (uncaught 500).
  // Require an object with a string `message` and optional string `clientId`.
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object", field: "body" },
      { status: 400 },
    );
  }
  const bad = badField(body, {
    message: str,
    clientId: (v) => optional(v, str),
  });
  if (bad) {
    return NextResponse.json(
      { error: `Invalid or missing field: ${bad}`, field: bad },
      { status: 400 },
    );
  }

  const message = (body.message as string).trim();
  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Enrich with client facts when chatting from a company page.
  let framed = message;
  if (clientId && clientId !== "system" && clientId !== "unknown") {
    try {
      const data: any = await readPipelineSafe();
      const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
      const c = companies.find(
        (x) => String(x?.id ?? "").toLowerCase() === clientId.toLowerCase(),
      );
      if (c) {
        const bits = [
          `Client: ${c.name} (id=${c.id})`,
          c.stage ? `stage=${c.stage}` : null,
          c.priority ? `priority=${c.priority}` : null,
          c.ownerName ? `owner=${c.ownerName}` : null,
          c.phone ? `phone=${c.phone}` : null,
          c.email ? `email=${c.email}` : null,
          c.demoUrl ? `demo=${c.demoUrl}` : null,
          c.offer ? `offer=${c.offer}` : null,
          c.responseStatus ? `sendStatus=${c.responseStatus}` : null,
          c.location ? `loc=${c.location}` : null,
        ].filter(Boolean);
        framed = `[Dashboard context — ${bits.join(" · ")}]\n\n${message}`;
      } else {
        framed = `[Dashboard context — clientId=${clientId} (not found in pipeline)]\n\n${message}`;
      }
    } catch {
      framed = `[Dashboard context — clientId=${clientId}]\n\n${message}`;
    }
  }

  const relayBase = getRelayUrl();
  if (!relayBase) {
    return NextResponse.json(
      {
        reply: `Agent unavailable: ${RELAY_NOT_CONFIGURED}.`,
        connected: false,
        relayed: false,
        relayError: RELAY_NOT_CONFIGURED,
      },
      { status: 200 },
    );
  }

  try {
    const res = await fetch(`${relayBase}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Relay-Token": getRelayToken() },
      body: JSON.stringify({ message: framed, clientId: clientId || "system" }),
      signal: AbortSignal.timeout(120000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        {
          reply:
            data.reply ||
            `Agent relay HTTP ${res.status}. Tunnel may be down — try again in a minute.`,
          connected: false,
        },
        { status: 200 },
      );
    }
    return NextResponse.json({
      reply: data.reply ?? data.message ?? "(empty reply)",
      connected: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        reply: `Agent unavailable: ${e?.message || "timeout"}. Try again.`,
        connected: false,
      },
      { status: 200 },
    );
  }
}

/**
 * GET /api/agent/chat?health=1 — lightweight connectivity probe for the UI chip.
 * Default GET without health still 405 (legacy poll path is dead).
 *
 * M16: this used to POST a real prompt to the supervisor ("reply PONG") and
 * wait up to 25s for the model to answer — a liveness probe that consumed agent
 * capacity and ran on every dashboard mount + a 60s interval. It now hits the
 * relay's token-free `/health` endpoint instead: it tells us the tunnel is up
 * without spending any agent work. A relay that predates `/health` will read as
 * offline here — that is honest (we cannot confirm reachability) and cheap to
 * fix on the relay side.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("health") !== "1") {
    return NextResponse.json(
      { error: "Use POST. For status: GET ?health=1" },
      { status: 405 },
    );
  }

  const relayBase = getRelayUrl();
  if (!relayBase) {
    return NextResponse.json({ connected: false, reply: RELAY_NOT_CONFIGURED });
  }

  try {
    const started = Date.now();
    const res = await fetch(`${relayBase}/health`, {
      method: "GET",
      headers: { "X-Relay-Token": getRelayToken() },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - started;
    let reply = res.ok ? "ok" : `relay HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data && typeof data === "object") {
        reply = String(
          (data as any).status ?? (data as any).reply ?? reply,
        );
      }
    } catch {
      /* non-JSON body is fine — res.ok already tells us what we need */
    }
    return NextResponse.json({
      connected: res.ok,
      reply: reply.slice(0, 120),
      latencyMs,
    });
  } catch (e: any) {
    return NextResponse.json({
      connected: false,
      reply: e?.message || "unreachable",
      latencyMs: null,
    });
  }
}
