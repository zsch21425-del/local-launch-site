"use client";

import Link from "next/link";
import { CalendarClock, Funnel, ListChecks } from "lucide-react";

import { MotionBackground } from "@/components/motion-background";
import { RevenueTracker } from "@/components/revenue-tracker";
import { SeoGauge } from "@/components/seo-gauge";
import { Progress } from "@/components/ui/progress";
import { usePipeline } from "@/hooks/use-pipeline";
import {
  formatDate,
  getRevenue,
  getStageCounts,
  getStats,
} from "@/lib/data";
import { stageTheme } from "@/lib/stages";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Reports — live Blob book via usePipeline (same as Home/Leads/Clients).
 * Was still on getCompanies() bundled snapshot until the 2026-09-01 LLOS upgrade.
 */
export default function ReportsPage() {
  const { companies, stages, loading, error } = usePipeline();
  const stats = getStats(companies);
  const revenue = getRevenue(companies);
  const stageCounts = getStageCounts(companies);
  const maxStageCount = Math.max(
    1,
    ...stages.map((stage) => stageCounts[stage.id] ?? 0),
  );

  const timeline = [...companies]
    .filter((company) => company.lastUpdated)
    .sort((a, b) => (b.lastUpdated ?? "").localeCompare(a.lastUpdated ?? ""));

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pipeline health, revenue, and SEO across every client.
            {loading ? " Loading live book…" : null}
          </p>
          {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pipeline funnel */}
          <section className={cn(glass, "flex flex-col gap-4 p-5 sm:p-6")}>
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <Funnel className="size-4 text-muted-foreground" aria-hidden />
              Pipeline funnel
            </h2>
            <div className="flex flex-col gap-3">
              {stages.map((stage) => {
                const count = stageCounts[stage.id] ?? 0;
                const theme = stageTheme(stage.color);
                const width =
                  count === 0
                    ? 0
                    : Math.max(6, Math.round((count / maxStageCount) * 100));
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-xs font-medium text-muted-foreground sm:w-32">
                      {stage.label}
                    </span>
                    <div className="h-6 flex-1 overflow-hidden rounded-full bg-foreground/[0.04]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700",
                          theme.bar,
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                    <span className="tnum w-6 shrink-0 text-right text-xs font-semibold text-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SEO score average */}
          <SeoGauge
            value={stats.avgSeoScore ?? 0}
            max={100}
            label="Average G-SCORE"
          />
        </div>

        {/* Revenue */}
        <RevenueTracker revenue={revenue} companies={companies} />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Playbook completion */}
          <section className={cn(glass, "flex flex-col gap-4 p-5 sm:p-6")}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                <ListChecks className="size-4 text-muted-foreground" aria-hidden />
                Playbook completion
              </h2>
              <span className="tnum text-lg font-bold text-foreground">
                {stats.playbookPercent}%
              </span>
            </div>
            <Progress
              value={stats.playbookPercent}
              className="h-2.5"
              indicatorClassName="bg-gradient-to-r from-primary to-primary"
            />
            <p className="text-xs text-muted-foreground">
              {stats.playbookDone} of {stats.playbookTotal} steps complete across{" "}
              {stats.total} clients.
            </p>

            <div className="mt-1 flex flex-col gap-2.5 border-t border-border pt-3">
              {companies
                .filter((c) => Array.isArray(c.playbook) && c.playbook.length > 0)
                .slice(0, 12)
                .map((company) => {
                  const total = company.playbook.length;
                  const done = company.playbook.filter((item) => item.done).length;
                  const percent =
                    total === 0 ? 0 : Math.round((done / total) * 100);
                  return (
                    <div key={company.id} className="flex items-center gap-3">
                      <Link
                        href={`/client/${company.id}`}
                        className="w-32 shrink-0 truncate text-xs font-medium text-muted-foreground hover:text-primary sm:w-40"
                      >
                        {company.name}
                      </Link>
                      <Progress value={percent} className="h-1.5 flex-1" />
                      <span className="tnum w-10 shrink-0 text-right text-[11px] text-muted-foreground">
                        {done}/{total}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Client acquisition timeline */}
          <section className={cn(glass, "flex flex-col gap-4 p-5 sm:p-6")}>
            <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <CalendarClock className="size-4 text-muted-foreground" aria-hidden />
              Activity timeline
            </h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dated activity yet.</p>
            ) : (
              <ol className="flex flex-col gap-1 border-l border-border pl-4">
                {timeline.slice(0, 12).map((company) => {
                  const theme = stageTheme(
                    stages.find((stage) => stage.id === company.stage)?.color ??
                      "slate",
                  );
                  return (
                    <li key={company.id} className="relative py-2 pl-2">
                      <span
                        className={cn(
                          "absolute top-3.5 -left-[21px] size-2.5 rounded-full ring-4 ring-card",
                          theme.dot,
                        )}
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <Link
                          href={`/client/${company.id}`}
                          className="text-sm font-medium text-foreground hover:text-primary"
                        >
                          {company.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(company.lastUpdated)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {company.category}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
