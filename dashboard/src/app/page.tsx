"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, ArrowUpRight, Globe, Layers, ShieldCheck } from "lucide-react";

import { usePipeline } from "@/hooks/use-pipeline";
import { hasReviewablePitch, type Company } from "@/lib/data";
import { stageIcon } from "@/lib/stages";
import { cn } from "@/lib/utils";

/** A prospect's next concrete action, right-aligned in the index. */
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
 * Home — a flagship entry, not a dashboard. A cinematic hero sells the product;
 * three unequal chapters route to the real work. Prospects are an index of
 * names, not a wall of cards.
 */
export default function HomePage() {
  const { companies, stages, agency, loading } = usePipeline();

  const pending = companies.filter(
    (c) => hasReviewablePitch(c) || (c.demoUrl || c.demo?.url),
  );
  const demos = companies.filter((c) => c.demoUrl || c.demo?.url).slice(0, 4);
  const stageGroups = stages
    .map((s) => ({
      stage: s,
      companies: companies.filter((c) => c.stage === s.id),
    }))
    .filter((g) => g.companies.length > 0);

  return (
    <div className="relative z-10">
      {/* ---------------------------------------------------------- HERO --- */}
      <section className="relative flex min-h-[68vh] items-end overflow-hidden">
        <img
          src="/art/hero.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
        />
        {/* Localized scrims — text sits on the dark left edge, art flows right. */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/35 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-16 pt-32 md:px-20 md:pb-24">
          <p className="font-serif text-lg italic text-cyan-300/90 md:text-xl">
            the agency, in motion
          </p>
          <h1 className="font-display mt-4 max-w-4xl text-5xl font-medium text-foreground sm:text-6xl md:text-7xl lg:text-[88px]">
            Every client.
            <br />
            One elegant view.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Prospects, approvals, and demos — orchestrated on a surface built to
            feel like a flagship product, not a spreadsheet.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/pipeline"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-cyan-300"
            >
              Enter the pipeline
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/approvals"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShieldCheck className="size-4" />
              {pending.length} decision{pending.length === 1 ? "" : "s"} need you
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ CHAPTERS --- */}
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-20">
        {/* Chapter 1 — Move work forward */}
        <Chapter label="01" title="Move work forward">
          <Link
            href="/approvals"
            className="group flex flex-col gap-3 border-b border-border py-8 transition-colors md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="font-serif text-lg italic text-muted-foreground">
                Decisions that are waiting on you
              </p>
              <h3 className="font-display mt-2 text-3xl text-foreground md:text-5xl">
                {loading ? "…" : pending.length} approval{pending.length === 1 ? "" : "s"}
              </h3>
            </div>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
              Review now
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </Chapter>

        {/* Chapter 2 — Build the next client (prospects as an index) */}
        <Chapter label="02" title="Build the next client">
          <div className="mb-8 flex items-center justify-between">
            <p className="max-w-md text-sm text-muted-foreground">
              {companies.length} prospects across the pipeline, ordered by stage.
            </p>
            <Link
              href="/pipeline"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Open board <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-10">
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
                    <span className="text-xs text-muted-foreground">
                      {group.length}
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {group.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/client/${c.id}`}
                          className="group flex items-center justify-between gap-4 border-b border-border/70 py-4 transition-colors"
                        >
                          <span className="font-display text-2xl text-foreground decoration-cyan-400/40 underline-offset-4 group-hover:underline md:text-[28px]">
                            {c.name}
                          </span>
                          <span className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                            <span className="hidden sm:inline">{c.location}</span>
                            <span className="tabular-nums text-muted-foreground/80">
                              {nextAction(c)}
                            </span>
                            <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </Chapter>

        {/* Chapter 3 — See what we can make */}
        <Chapter label="03" title="See what we can make">
          {demos.length > 0 ? (
            <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
              {demos.map((c) => (
                <a
                  key={c.id}
                  href={c.demoUrl || c.demo?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-[160px] flex-col justify-between gap-4 bg-card p-6 transition-colors hover:bg-cyan-400/5"
                >
                  <div className="flex items-center justify-between">
                    <Globe className="size-4 text-muted-foreground" />
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  </div>
                  <div>
                    <h4 className="font-display text-xl text-foreground">{c.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.category ?? "Client site"} · {c.location}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="border-b border-border py-8 text-sm text-muted-foreground">
              No live demos yet — approve a build and it lands here.
            </p>
          )}
        </Chapter>

        {/* Quiet utility footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-10">
          <p className="text-sm text-muted-foreground">
            {agency.name} — {agency.tagline}
          </p>
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Layers className="size-3.5" /> Reports
          </Link>
        </div>
      </div>
    </div>
  );
}

function Chapter({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-20 md:pt-28">
      <div className="mb-10 flex items-baseline gap-4">
        <span className="font-display text-sm text-muted-foreground">{label}</span>
        <h2 className="font-display text-2xl font-medium text-foreground md:text-4xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
