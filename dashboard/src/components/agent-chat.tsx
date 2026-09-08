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

const QUICK_PROMPTS = [
  "What's the next action on this lead?",
  "Draft a short pitch email I can approve.",
  "Verify contact facts and demo link.",
  "Summarize pipeline status in 3 bullets.",
];

/** Chat panel scoped to one client. POSTs to /api/agent/chat (reply inline). */
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
  const [connected, setConnected] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }, []);

  // Probe agent connectivity on mount + every 60s
  useEffect(() => {
    let cancelled = false;
    async function probe() {
      try {
        const res = await fetch("/api/agent/chat?health=1", {
          signal: AbortSignal.timeout(28000),
        });
        const data = (await res.json()) as { connected?: boolean };
        if (!cancelled) setConnected(Boolean(data.connected));
      } catch {
        if (!cancelled) setConnected(false);
      }
    }
    void probe();
    const t = setInterval(probe, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    scrollBottom();
  }, [messages, waitingForReply, scrollBottom]);

  async function sendMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", content: text },
    ]);
    setPending(true);
    setWaitingForReply(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, message: text }),
      });
      const data = (await res.json()) as {
        reply?: string;
        connected?: boolean;
      };

      if (typeof data.connected === "boolean") setConnected(data.connected);

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "agent", content: data.reply! },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "agent",
            content: "No reply from agent. Try again.",
          },
        ]);
        setConnected(false);
      }
    } catch {
      setConnected(false);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: "agent",
          content: "Couldn't reach the agent.",
        },
      ]);
    } finally {
      setPending(false);
      setWaitingForReply(false);
    }
  }

  const statusLabel =
    connected === null
      ? "Checking link…"
      : connected
        ? `Online — ${clientName}`
        : "Disconnected — tunnel/relay";

  return (
    <section
      className={cn(glass, "flex h-full flex-col overflow-hidden", className)}
    >
      <header className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700">
          <Bot className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Local Launch Agent
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span
              className={cn(
                "size-1.5 rounded-full",
                waitingForReply
                  ? "animate-pulse bg-amber-500"
                  : connected
                    ? "bg-emerald-500"
                    : connected === false
                      ? "bg-rose-500"
                      : "bg-slate-300",
              )}
              aria-hidden
            />
            {waitingForReply ? "Working…" : statusLabel}
          </p>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="m-auto flex max-w-[280px] flex-col items-center gap-3 text-center text-slate-400">
            <Bot className="size-6" aria-hidden />
            <p className="text-sm">
              Ask about {clientName}&apos;s pipeline, pitch, demo, or next steps.
              Context is auto-attached.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={pending || waitingForReply || connected === false}
                  onClick={() => void sendMessage(q)}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-40"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <AgentMessage
              key={message.id}
              message={message}
              pending={
                message.role === "agent" && message.content === ""
              }
            />
          ))
        )}
        {waitingForReply ? (
          <AgentMessage
            message={{ id: "polling", role: "agent", content: "" }}
            pending
          />
        ) : null}
      </div>

      <AgentInput
        onSend={sendMessage}
        disabled={pending || waitingForReply}
      />
    </section>
  );
}
