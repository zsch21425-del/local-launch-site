"use client";

import Link from "next/link";
import * as React from "react";
import { Activity, Globe, Rocket, Users } from "lucide-react";

import { usePipeline } from "@/hooks/use-pipeline";
import { resolveDemoUrl } from "@/lib/data";
import { MetricCard } from "@/components/metric-card";
import { CompanyTile } from "@/components/company-tile";

/**
 * Home — a dashboard, not a website. A slow-moving cinematic hero up top,
 * four live KPI cards, then every company as a compact rectangular tile
 * grouped by stage. Click any tile to open that company's workstation.
 */
export default function HomePage() {
  const { companies, stages, loading } = usePipeline();

  const batchReady = companies.filter(
    (c) => c.stage === "prospect" && !resolveDemoUrl(c) && !c.pitchDraft,
  ).length;
  const demoCount = companies.filter((c) => resolveDemoUrl(c)).length;
  const active = companies.filter((c) =>
    ["audit", "pitch", "contacted", "response"].includes(c.stage),
  ).length;

  const stageGroups = stages
    .map((s) => ({
      stage: s,
      companies: companies.filter((c) => c.stage === s.id),
    }))
    .filter((g) => g.companies.length > 0);

  return (
    <div className="relative z-10">
      {/* --------------------------------------------------------- HERO --- */}
      <section className="relative flex h-[36vh] min-h-[260px] items-end overflow-hidden">
        <img
          src="/art/hero.png"
          alt=""
          aria-hidden
          className="animate-kenburns absolute inset-0 h-full w-full object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-8 md:px-20">
          <p className="font-serif text-lg italic text-cyan-300/90">
            the agency, in motion
          </p>
          <h1 className="font-display mt-3 max-w-3xl text-4xl font-medium text-foreground sm:text-5xl md:text-6xl">
            Every client.
            <br />
            One elegant view.
          </h1>
        </div>
      </section>

      {/* ----------------------------------------------------------- KPI --- */}
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-20">
        <div className="-mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Prospects"
            value={String(companies.length)}
            note="across the pipeline"
            icon={Users}
            tone="violet"
            progress={100}
          />
          <MetricCard
            label="Active pipeline"
            value={String(active)}
            note="moving toward launch"
            icon={Activity}
            tone="cyan"
            progress={companies.length ? Math.round((active / companies.length) * 100) : 0}
          />
          <MetricCard
            label="Next batch"
            value={String(batchReady)}
            note="ready to start"
            icon={Rocket}
            tone="teal"
            progress={100}
          />
          <MetricCard
            label="Live demos"
            value={String(demoCount)}
            note="client sites shipped"
            icon={Globe}
            tone="magenta"
            progress={companies.length ? Math.round((demoCount / companies.length) * 100) : 0}
          />
        </div>
      </div>

      {/* ---------------------------------------------------- COMPANY GRID --- */}
      <div className="mx-auto w-full max-w-[1440px] px-6 py-10 md:px-20">
        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading pipeline…
          </p>
        ) : stageGroups.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No companies in the pipeline yet.
          </p>
        ) : (
          stageGroups.map(({ stage, companies: group }) => (
            <section key={stage.id} className="mb-10">
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="font-display text-sm font-medium text-foreground">
                  {stage.label}
                </h2>
                <span className="tnum text-xs text-muted-foreground">
                  {group.length}
                </span>
                <span className="h-px flex-1 bg-border/70" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.map((c) => (
                  <CompanyTile key={c.id} company={c} />
                ))}
              </div>
            </section>
          ))
        )}

        {/* Quiet footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground">
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            Open the full pipeline
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/approvals"
            className="transition-colors hover:text-foreground"
          >
            Next batch
          </Link>
        </div>
      </div>
    </div>
  );
}
