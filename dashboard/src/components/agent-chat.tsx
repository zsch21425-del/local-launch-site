"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

import { AgentInput } from "@/components/agent-input";
import { AgentMessage, type ChatMessage } from "@/components/agent-message";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

let messageCounter = 0;
function nextId() {
  messageCounter += 1;
  return `msg-${messageCounter}`;
}

interface MsgRow {
  id: number;
  message: string;
  reply: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
}

/** Chat panel scoped to one client. POSTs to /api/agent/chat and polls until agent responds. */
export function AgentChat({
  clientId,
  clientName,
  className,
}: {
  clientId: string;
  clientName: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }, []);

  // Poll for agent responses
  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/agent/chat?clientId=${encodeURIComponent(clientId)}`);
      const data = (await res.json()) as { messages: MsgRow[] };
      
      for (const row of data.messages ?? []) {
        if (row.reply && row.status === "done") {
          // Check we haven't shown this yet
          const already = messages.find(
            (m) => m.role === "agent" && m.content.includes(row.reply!.slice(0, 30)),
          );
          if (!already) {
            setMessages((prev) => [
              ...prev,
              { id: nextId(), role: "agent", content: row.reply! },
            ]);
            setWaitingForReply(false);
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = undefined;
            }
            const tId = (pollRef as any).timeoutId;
            if (tId) clearTimeout(tId);
          }
        }
      }
    } catch {
      // Keep polling
    }
  }, [clientId, messages]);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function sendMessage(text: string) {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", content: text }]);
    setPending(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message: text }),
      });
      const data = (await res.json()) as { reply?: string };

      // If the dashboard relay returned the reply inline, show it now
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "agent", content: data.reply! },
        ]);
        setWaitingForReply(false);
        setPending(false);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = undefined;
        }
        return;
      }

      // Otherwise fall back to polling for async agents
      setWaitingForReply(true);

      // Poll for the agent's reply (give up after 90s so we don't spin forever)
      const POLL_TIMEOUT_MS = 90_000;
      const timeoutId = setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = undefined;
        }
        setWaitingForReply(false);
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "agent", content: "Agent is taking longer than usual. Try again or check back in a minute." },
        ]);
      }, POLL_TIMEOUT_MS);

      pollRef.current = setInterval(poll, 3000);
      // Store the timeout id on the ref so we can clear it when the reply lands
      (pollRef as any).timeoutId = timeoutId;
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "agent", content: "Couldn't reach the agent." },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={cn(glass, "flex h-full flex-col overflow-hidden", className)}>
      <header className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700">
          <Bot className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Local Launch Agent</p>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span
              className={cn("size-1.5 rounded-full", waitingForReply ? "animate-pulse bg-amber-500" : "bg-emerald-500")}
              aria-hidden
            />
            {waitingForReply ? "Working…" : `Online — ${clientName}`}
          </p>
        </div>
      </header>

      <div ref={scrollRef} className="flex min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="m-auto flex max-w-[220px] flex-col items-center gap-2 text-center text-slate-400">
            <Bot className="size-6" aria-hidden />
            <p className="text-sm">Ask about {clientName}&apos;s pipeline, playbook, or next steps.</p>
          </div>
        ) : (
          messages.map((message) => (
            <AgentMessage key={message.id} message={message} pending={message.role === "agent" && message.content === ""} />
          ))
        )}
        {waitingForReply ? (
          <AgentMessage message={{ id: "polling", role: "agent", content: "" }} pending />
        ) : null}
      </div>

      <AgentInput onSend={sendMessage} disabled={pending || waitingForReply} />
    </section>
  );
}
