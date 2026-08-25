/**
 * A2A client for the dashboard — server-side calls to fleet agents.
 * Uses each agent's A2A_PEER_TOKENS[assistant] as the caller credential
 * (the dashboard presents itself as "assistant" to the fleet).
 */
import { FleetAgent, readPeerToken } from "@/lib/fleet";

const A2A_PATH = "/a2a/v1/message";

export interface A2AReply {
  ok: boolean;
  text: string;
  error?: string;
}

export async function a2aSend(agent: FleetAgent, text: string, timeoutMs = 90000): Promise<A2AReply> {
  const token = readPeerToken(agent, "assistant");
  if (!token) return { ok: false, text: "", error: `No peer token for ${agent.name}` };

  const payload = {
    jsonrpc: "2.0",
    id: `dash-${Date.now()}`,
    method: "SendMessage",
    params: {
      message: { role: "ROLE_USER", parts: [{ text }] },
    },
  };

  try {
    const res = await fetch(`http://127.0.0.1:${agent.port}${A2A_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false, text: "", error: `HTTP ${res.status}` };
    const d = await res.json();
    const text = d?.result?.task?.status?.message?.parts?.[0]?.text ?? "";
    return { ok: true, text };
  } catch (e: any) {
    return { ok: false, text: "", error: e?.message ?? "A2A call failed" };
  }
}
