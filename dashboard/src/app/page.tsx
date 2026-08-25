"use client";

import { useState } from "react";
import { MotionBackground } from "@/components/motion-background";
import { PipelineKanban } from "@/components/pipeline-kanban";
import { RevenueTracker } from "@/components/revenue-tracker";
import { StatsBar } from "@/components/stats-bar";
import { TodaysTasks } from "@/components/todays-tasks";
import { WorkInboxPanel } from "@/components/work-inbox";
import {
  getAgency,
  getCompanies,
  getOpenTasks,
  getRevenue,
  getStages,
  getStats,
  getWorkInbox,
  type Company,
  type StageId,
} from "@/lib/data";

export default function HomePage() {
  const agency = getAgency();
  const stages = getStages();
  const [companies, setCompanies] = useState<Company[]>(() => getCompanies());

  function handleMove(companyId: string, stage: StageId, index: number) {
    setCompanies((prev) => {
      const next = prev.map((c) =>
        c.id === companyId ? { ...c, stage } : c,
      );
      // Reorder within stage
      const inStage = next.filter((c) => c.stage === stage);
      const moved = inStage.find((c) => c.id === companyId);
      if (!moved) return next;
      const others = inStage.filter((c) => c.id !== companyId);
      others.splice(index, 0, moved);
      const reordered = next.map((c) =>
        c.stage === stage ? (others.shift() ?? c) : c,
      );
      return reordered;
    });
  }

  const stats = getStats(companies);
  const revenue = getRevenue(companies);
  const tasks = getOpenTasks(companies);
  const inbox = getWorkInbox(companies);

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Header */}
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {agency.name} OS
          </h1>
          <p className="max-w-2xl text-sm text-slate-500 sm:text-base">
            What needs you today, then the rest of the pipeline.
          </p>
        </section>

        {/* Stats Bar */}
        <StatsBar stats={stats} />

        <WorkInboxPanel inbox={inbox} />

        {/* Revenue Tracker */}
        <RevenueTracker revenue={revenue} companies={companies} />

        {/* Pipeline Kanban */}
        <section id="pipeline">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Pipeline
          </h2>
          <PipelineKanban
            stages={stages}
            companies={companies}
            onMove={handleMove}
          />
        </section>

        {/* Today's Tasks */}
        <section id="tasks">
          <TodaysTasks tasks={tasks} />
        </section>
      </div>
    </>
  );
}
