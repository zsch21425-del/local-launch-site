"use client";

import * as React from "react";

import { MotionBackground } from "@/components/motion-background";
import { PipelineKanban } from "@/components/pipeline-kanban";
import { StatsBar } from "@/components/stats-bar";
import { WorkInboxPanel } from "@/components/work-inbox";
import { usePipeline } from "@/hooks/use-pipeline";
import {
  getStats,
  getWorkInbox,
  type StageId,
} from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Home = operational command center.
 * 1) Honest stage funnel + action buckets
 * 2) Kanban board for drag-move (still live Blob)
 * Removed: vanity revenue strip, playbook % noise, inflated email backlog.
 */
export default function HomePage() {
  const { companies, stages, agency, loading, error, reload, setCompanies } =
    usePipeline();
  const [moveError, setMoveError] = React.useState<string | null>(null);
  const [showBoard, setShowBoard] = React.useState(true);

  async function handleMove(companyId: string, stage: StageId, index: number) {
    setCompanies((prev) => {
      const next = prev.map((c) =>
        c.id === companyId ? { ...c, stage } : c,
      );
      const inStage = next.filter((c) => c.stage === stage);
      const moved = inStage.find((c) => c.id === companyId);
      if (!moved) return next;
      const others = inStage.filter((c) => c.id !== companyId);
      others.splice(index, 0, moved);
      return next.map((c) => (c.stage === stage ? (others.shift() ?? c) : c));
    });

    try {
      const res = await fetch("/api/pipeline/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, stage }),
      });
      if (!res.ok) {
        const msg = (
          await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        ).error;
        throw new Error(msg || `HTTP ${res.status}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to move card";
      await reload();
      setMoveError(msg);
    }
  }

  const stats = getStats(companies);
  const inbox = getWorkInbox(companies);

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {agency.name} Ops
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Accurate pipeline position + what to do next. Not a vanity dump.
              </p>
            </div>
            <AgentLinkChip />
          </div>
          {loading ? (
            <p className="text-xs text-slate-400">Loading live pipeline…</p>
          ) : null}
          {error ? (
            <p className="text-sm text-rose-600">
              Could not load live pipeline: {error}
            </p>
          ) : null}
        </section>

        <section id="pipeline" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Board (drag to move stage)
            </h2>
            <button
              type="button"
              onClick={() => setShowBoard((v) => !v)}
              className="text-xs font-medium text-emerald-700 hover:underline"
            >
              {showBoard ? "Hide board" : "Show board"}
            </button>
          </div>
          {moveError ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Could not save that move: {moveError}. Reloaded live state.
            </p>
          ) : null}
          {showBoard ? (
            <PipelineKanban
              stages={stages}
              companies={companies}
              onMove={handleMove}
            />
          ) : null}
        </section>

        <StatsBar
          stats={stats}
          ops={{
            sendNow: inbox.sendNow,
            awaitingReply: inbox.awaitingReply,
            clients: inbox.clients,
            inReview: inbox.inReview,
            sentUnverified: inbox.sentUnverified,
            sentBounced: inbox.sentBounced,
            bounceRisk: inbox.bounceRisk,
          }}
        />

        <WorkInboxPanel inbox={inbox} />
      </div>
    </>
  );
}

function AgentLinkChip() {
  const [connected, setConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
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

  const label =
    connected === null
      ? "Checking agent…"
      : connected
        ? "Agent connected"
        : "Agent offline";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        connected === null
          ? "bg-slate-50 text-slate-500 ring-slate-200"
          : connected
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : "bg-rose-50 text-rose-700 ring-rose-200",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          connected === null
            ? "animate-pulse bg-slate-400"
            : connected
              ? "bg-emerald-500"
              : "bg-rose-500",
        )}
      />
      {label}
    </span>
  );
}
