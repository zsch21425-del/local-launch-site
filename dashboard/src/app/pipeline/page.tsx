"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight } from "lucide-react";

import { usePipeline, invalidatePipeline } from "@/hooks/use-pipeline";
import { hasReviewablePitch, type Company, type StageId } from "@/lib/data";
import { stageIcon } from "@/lib/stages";

function nextAction(c: Company): string {
  if (hasReviewablePitch(c)) return "Review pitch";
  if (c.demoUrl || c.demo?.url) return "Review demo";
  if (c.stage === "prospect") return "Begin audit";
  if (c.stage === "audit") return "Finish audit";
  if (c.stage === "contacted") return "Follow up";
  if (c.stage === "response") return "Close";
  return "Continue";
}

/**
 * Pipeline — the full prospects index. Stage-grouped, numbered, clickable
 * names (not cards). The stage is movable via a quiet inline selector.
 */
export default function PipelinePage() {
  const { companies, stages, loading, reload, setCompanies } = usePipeline();
  const [moveError, setMoveError] = React.useState<string | null>(null);

  const stageGroups = stages
    .map((s) => ({
      stage: s,
      companies: companies.filter((c) => c.stage === s.id),
    }))
    .filter((g) => g.companies.length > 0);

  async function moveStage(companyId: string, stage: StageId) {
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, stage } : c)),
    );
    setMoveError(null);
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
      const msg = e instanceof Error ? e.message : "Failed to move prospect";
      await reload();
      setMoveError(msg);
    }
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-16 md:px-20 md:py-24">
      {/* Header */}
      <header className="mb-16 md:mb-20">
        <p className="font-serif text-lg italic text-cyan-300/90">the pipeline</p>
        <h1 className="font-display mt-4 text-5xl font-medium text-foreground sm:text-6xl">
          Every prospect, in motion.
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          {loading ? "Loading…" : `${companies.length} prospects`} across{" "}
          {stages.length} stages — ordered by where each one is in the work.
        </p>
        {moveError ? (
          <p className="mt-4 text-sm text-destructive">
            Couldn&apos;t save that move: {moveError}. Reloaded live state.
          </p>
        ) : null}
      </header>

      {/* Stage-grouped index */}
      <div className="flex flex-col gap-12">
        {stageGroups.map(({ stage, companies: group }, i) => {
          const Icon = stageIcon(stage.icon);
          return (
            <section key={stage.id}>
              <div className="flex items-baseline gap-3 border-b border-border pb-2">
                <span className="font-display text-sm text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex items-center gap-1.5 text-base text-foreground">
                  <Icon className="size-3.5" />
                  {stage.label}
                </span>
                <span className="text-xs text-muted-foreground">{group.length}</span>
              </div>

              <ul className="flex flex-col">
                {group.map((c) => (
                  <li key={c.id}>
                    <div className="group flex items-center justify-between gap-4 border-b border-border/70 py-4">
                      <Link
                        href={`/client/${c.id}`}
                        className="font-display text-2xl text-foreground decoration-cyan-400/40 underline-offset-4 group-hover:underline md:text-[28px]"
                      >
                        {c.name}
                      </Link>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="hidden text-sm text-muted-foreground sm:inline">
                          {c.location}
                        </span>
                        <span className="hidden text-sm text-muted-foreground/80 md:inline">
                          {nextAction(c)}
                        </span>
                        <select
                          value={c.stage}
                          onChange={(e) => moveStage(c.id, e.target.value as StageId)}
                          aria-label={`Move ${c.name} to stage`}
                          className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground focus:border-border focus:outline-none"
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.id} className="bg-card">
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
