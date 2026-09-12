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

/** Chat panel scoped to one client OR one stage (a batch). POSTs to /api/agent/chat. */
export function AgentChat({
  clientId,
  clientName,
  stageId,
  stageLabel,
  batchCompanyIds,
  className,
}: {
  clientId?: string;
  clientName?: string;
  stageId?: string;
  stageLabel?: string;
  batchCompanyIds?: string[];
  className?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [proposal, setProposal] = useState<{
    actionType: string;
    companyIds: string[];
    targetStage?: string;
    summary?: string;
  } | null>(null);
  const [proposalBusy, setProposalBusy] = useState(false);
  const [proposalResult, setProposalResult] = useState<string | null>(null);
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
        body: JSON.stringify(
          stageId
            ? { stageId, batchCompanyIds: batchCompanyIds ?? [], message: text }
            : { clientId, message: text },
        ),
      });
      const data = (await res.json()) as {
        reply?: string;
        connected?: boolean;
        proposal?: {
          actionType: string;
          companyIds: string[];
          targetStage?: string;
          summary?: string;
        };
      };

      if (typeof data.connected === "boolean") setConnected(data.connected);
      if (data.proposal) setProposal(data.proposal);

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

  const scopeName = stageId ? (stageLabel ?? stageId) : (clientName ?? "this lead");
  const statusLabel =
    connected === null
      ? "Checking link…"
      : connected
        ? `Online — ${scopeName}`
        : "Disconnected — tunnel/relay";

  async function approveProposal() {
    if (!proposal) return;
    setProposalBusy(true);
    setProposalResult(null);
    try {
      const res = await fetch("/api/agent/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: proposal.actionType,
          companyIds: proposal.companyIds,
          targetStage: proposal.targetStage,
        }),
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || "failed");
      setProposal(null);
      setProposalResult(`Queued as job ${d.job.id} — the agent will work it under the quality gates.`);
    } catch (e: any) {
      setProposalResult(e.message || "Failed to queue proposal");
    } finally {
      setProposalBusy(false);
    }
  }

  return (
    <section
      className={cn(glass, "flex h-full flex-col overflow-hidden", className)}
    >
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bot className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Local Launch Agent
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                waitingForReply
                  ? "animate-pulse bg-amber-500"
                  : connected
                    ? "bg-primary"
                    : connected === false
                      ? "bg-destructive"
                      : "bg-muted",
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
        {proposal ? (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-3">
            <p className="text-xs font-semibold text-foreground">Proposed action</p>
            <p className="mt-1 text-sm text-foreground">
              <span className="font-medium">{proposal.actionType}</span> for{" "}
              {proposal.companyIds.length} lead{proposal.companyIds.length === 1 ? "" : "s"}
              {proposal.targetStage ? ` → ${proposal.targetStage}` : ""}
            </p>
            {proposal.summary ? (
              <p className="mt-1 text-xs text-muted-foreground">{proposal.summary}</p>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                disabled={proposalBusy}
                onClick={() => void approveProposal()}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {proposalBusy ? "Queuing…" : "Approve & queue"}
              </button>
              <button
                type="button"
                disabled={proposalBusy}
                onClick={() => setProposal(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
        {proposalResult ? (
          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            {proposalResult}
          </p>
        ) : null}
        {messages.length === 0 ? (
          <div className="m-auto flex max-w-[280px] flex-col items-center gap-3 text-center text-muted-foreground">
            <Bot className="size-6" aria-hidden />
            <p className="text-sm">
              {stageId
                ? `Ask about the ${scopeName} batch, its prospects, or next moves.`
                : `Ask about ${clientName}&apos;s pipeline, pitch, demo, or next steps.`}
              Context is auto-attached.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={pending || waitingForReply || connected === false}
                  onClick={() => void sendMessage(q)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
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
