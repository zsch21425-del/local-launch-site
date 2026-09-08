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

/**
 * Pull the agent's reply text out of a JSON-RPC `result`. The fleet answers in
 * TWO envelope shapes and BOTH must stay in sync with the worker
 * `scripts/run-fleet.js` (which reads `result.artifacts[0].parts[0].text`) and
 * with `scripts/collect-fleet.js` (`result.task.status.message.parts[0].text`).
 * Do NOT change the worker to match this file — mirror what the worker accepts.
 * Returns null when neither shape yields a non-empty string.
 */
function extractReplyText(result: any): string | null {
  const artifactText = result?.artifacts?.[0]?.parts?.[0]?.text;
  if (typeof artifactText === "string" && artifactText.trim()) return artifactText;
  const taskText = result?.task?.status?.message?.parts?.[0]?.text;
  if (typeof taskText === "string" && taskText.trim()) return taskText;
  return null;
}

/**
 * Inspect a task status for a non-success terminal state. Returns an error
 * string when the task ran but did NOT complete, else null.
 */
function taskStatusError(result: any): string | null {
  const state = result?.task?.status?.state ?? result?.status?.state;
  if (typeof state !== "string" || !state) return null;
  const s = state.toLowerCase();
  if (s.includes("complet") || s.includes("success") || s === "ok") return null;
  if (
    s.includes("fail") ||
    s.includes("error") ||
    s.includes("cancel") ||
    s.includes("reject") ||
    s.includes("unknown")
  ) {
    return `task not completed (status: ${state})`;
  }
  return null;
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

    let d: any;
    try {
      d = await res.json();
    } catch {
      return { ok: false, text: "", error: "A2A response body was not valid JSON" };
    }

    // A 200 body can still carry a JSON-RPC transport error.
    if (d?.error) {
      const msg = d.error?.message || JSON.stringify(d.error);
      return { ok: false, text: "", error: `JSON-RPC error: ${msg}` };
    }

    const result = d?.result;
    if (!result || typeof result !== "object") {
      return { ok: false, text: "", error: "A2A reply missing result envelope" };
    }

    // Task ran but did not complete successfully.
    const statusErr = taskStatusError(result);
    if (statusErr) return { ok: false, text: "", error: statusErr };

    const reply = extractReplyText(result);
    if (reply === null) {
      return {
        ok: false,
        text: "",
        error: "A2A reply carried no text in any known envelope shape",
      };
    }
    return { ok: true, text: reply };
  } catch (e: any) {
    return { ok: false, text: "", error: e?.message ?? "A2A call failed" };
  }
}
