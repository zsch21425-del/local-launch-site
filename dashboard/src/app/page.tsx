"use client";

import * as React from "react";

import { MotionBackground } from "@/components/motion-background";
import { PipelineKanban } from "@/components/pipeline-kanban";
import { RevenueTracker } from "@/components/revenue-tracker";
import { StatsBar } from "@/components/stats-bar";
import { TodaysTasks } from "@/components/todays-tasks";
import { WorkInboxPanel } from "@/components/work-inbox";
import { usePipeline } from "@/hooks/use-pipeline";
import {
  getOpenTasks,
  getRevenue,
  getStats,
  getWorkInbox,
  type StageId,
} from "@/lib/data";

export default function HomePage() {
  const { companies, stages, agency, loading, error, reload, setCompanies } = usePipeline();
  const [moveError, setMoveError] = React.useState<string | null>(null);

  async function handleMove(companyId: string, stage: StageId, index: number) {
    // Optimistic local update first (feels instant), then persist to Blob.
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
        const msg = (await res.json().catch(() => ({ error: `HTTP ${res.status}` }))).error;
        throw new Error(msg || `HTTP ${res.status}`);
      }
    } catch (e) {
      // Move failed to persist — reload authoritative Blob state + surface error.
      const msg = e instanceof Error ? e.message : "Failed to move card";
      setCompanies((prev) => prev); // no-op to satisfy setter type; reload below reflects truth
      await reload();
      setMoveError(msg);
    }
  }

  const stats = getStats(companies);
  const revenue = getRevenue(companies);
  const tasks = getOpenTasks(companies);
  const inbox = getWorkInbox(companies);

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {agency.name} OS
          </h1>
          <p className="max-w-2xl text-sm text-slate-500 sm:text-base">
            What needs you today, then the rest of the pipeline.
          </p>
          {loading ? (
            <p className="text-xs text-slate-400">Loading live pipeline…</p>
          ) : null}
          {error ? (
            <p className="text-sm text-rose-600">Could not load live pipeline: {error}</p>
          ) : null}
        </section>

        <StatsBar stats={stats} />
        <WorkInboxPanel inbox={inbox} />
        <RevenueTracker revenue={revenue} companies={companies} />

        <section id="pipeline">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Pipeline</h2>
          {moveError ? (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              Could not save that move: {moveError}. Card was returned to its original column.
            </p>
          ) : null}
          <PipelineKanban stages={stages} companies={companies} onMove={handleMove} />
        </section>

        <section id="tasks">
          <TodaysTasks tasks={tasks} />
        </section>
      </div>
    </>
  );
}
