"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, Users } from "lucide-react";

import { usePipeline } from "@/hooks/use-pipeline";
import { stageIcon, stageTheme, STAGE_DESCRIPTIONS } from "@/lib/stages";
import { CLIENT_STAGES } from "@/lib/data";

/** The 7-stage prospecting funnel, in order. */
const FUNNEL = [
  "prospect",
  "audit",
  "pitch",
  "quality-check",
  "approval",
  "outreach",
  "follow-up",
];

/**
 * Home — a launchpad of the 7 stages. Each stage is a clickable card that
 * opens that stage's page, where its prospects live and each company links to
 * its own workstation.
 */
export default function HomePage() {
  const { companies, stages, loading } = usePipeline();

  const funnelStages = FUNNEL.map((id) => stages.find((s) => s.id === id)).filter(
    (s): s is NonNullable<typeof s> => Boolean(s),
  );
  const clientCount = companies.filter((c) => CLIENT_STAGES.includes(c.stage)).length;

  return (
    <div className="relative z-10">
      {/* --------------------------------------------------------- HERO --- */}
      <section className="relative flex h-[32vh] min-h-[220px] items-end overflow-hidden">
        <img
          src="/art/hero.png"
          alt=""
          aria-hidden
          className="animate-kenburns absolute inset-0 h-full w-full object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-7 md:px-20">
          <p className="font-serif text-lg italic text-cyan-300/90">
            the agency, in motion
          </p>
          <h1 className="font-display mt-2 max-w-3xl text-3xl font-medium text-foreground sm:text-4xl md:text-5xl">
            Every client. One elegant view.
          </h1>
        </div>
      </section>

      {/* --------------------------------------------------- STAGE CARDS --- */}
      <div className="mx-auto w-full max-w-[1440px] px-6 py-10 md:px-20">
        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Loading pipeline…
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {funnelStages.map((stage, i) => {
              const Icon = stageIcon(stage.icon);
              const theme = stageTheme(stage.color);
              const count = companies.filter((c) => c.stage === stage.id).length;
              const desc = STAGE_DESCRIPTIONS[stage.id] ?? "";
              return (
                <Link
                  key={stage.id}
                  href={`/stage/${stage.id}`}
                  className="group flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900 p-5 transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-[0_0_24px_-6px_rgba(139,92,246,0.35)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-sm text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <Icon className={`size-4 ${theme.text}`} />
                    </span>
                    <span className="tnum rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <h2 className="font-display mt-4 text-xl text-foreground">
                    {stage.label}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
                    Open stage
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}

            {/* Won + Building — paying clients, separate section */}
            <Link
              href="/clients"
              className="group flex flex-col rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-[0_0_24px_-6px_rgba(16,185,129,0.35)]"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="size-4 text-emerald-300" />
                </span>
                <span className="tnum rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {clientCount}
                </span>
              </div>
              <h2 className="font-display mt-4 text-xl text-foreground">
                Clients
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Finished clients in their own section — monthly SEO audits to keep improving their side.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-emerald-300">
                Open clients
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        )}

        {/* Quiet footer */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            Open the full pipeline
            <span aria-hidden>→</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/reports" className="transition-colors hover:text-foreground">
              Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
