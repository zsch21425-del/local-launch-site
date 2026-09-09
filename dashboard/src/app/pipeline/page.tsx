"use client";

import * as React from "react";

import { MotionBackground } from "@/components/motion-background";
import { PipelineKanban } from "@/components/pipeline-kanban";
import { StatsBar } from "@/components/stats-bar";
import { WorkInboxPanel } from "@/components/work-inbox";
import { usePipeline, invalidatePipeline } from "@/hooks/use-pipeline";
import {
  getStats,
  getWorkInbox,
  type StageId,
} from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Pipeline — the operational kanban board (drag to move stage).
 * Moved from `/` to `/pipeline` when the Home page became a flagship entry.
 */
export default function PipelinePage() {
  const { companies, stages, agency, loading, error, lastSync, reload, setCompanies } =
    usePipeline();
  const [moveError, setMoveError] = React.useState<string | null>(null);

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
      void invalidatePipeline();
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
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {agency.name} Ops
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Accurate pipeline position + what to do next. Not a vanity dump.
              </p>
            </div>
            <AgentLinkChip />
          </div>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading live pipeline…</p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive">
              Could not load live pipeline: {error}
              {lastSync
                ? ` — showing last-known data from ${new Date(lastSync).toLocaleTimeString()}`
                : ""}
            </p>
          ) : null}
          {!loading && !error && lastSync ? (
            <p className="text-xs text-muted-foreground">
              Live pipeline · synced {new Date(lastSync).toLocaleTimeString()}
            </p>
          ) : null}
        </section>

        <section id="pipeline" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              Board (drag to move stage)
            </h2>
          </div>
          {moveError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Could not save that move: {moveError}. Reloaded live state.
            </p>
          ) : null}
          <PipelineKanban
            stages={stages}
            companies={companies}
            onMove={handleMove}
          />
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
          ? "bg-muted text-muted-foreground ring-border"
          : connected
            ? "bg-primary/10 text-primary ring-ring"
            : "bg-destructive/10 text-destructive ring-destructive",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          connected === null
            ? "animate-pulse bg-muted-foreground"
            : connected
              ? "bg-primary"
              : "bg-destructive",
        )}
      />
      {label}
    </span>
  );
}
