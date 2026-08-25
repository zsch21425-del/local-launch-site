"use client";

import {
  Activity,
  Gauge,
  ListChecks,
  Radar,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { PipelineStats } from "@/lib/data";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

interface StatDef {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
  scrollTo: string;
  external?: boolean;
}

/** Six-up overview strip below the hero. Every card is clickable. */
export function StatsBar({
  stats,
  className,
}: {
  stats: PipelineStats;
  className?: string;
}) {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Brief highlight pulse
      el.style.transition = "box-shadow 0.3s";
      el.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.4)";
      setTimeout(() => {
        el.style.boxShadow = "";
      }, 1500);
    }
  }

  const items: StatDef[] = [
    {
      key: "total",
      label: "In pipeline",
      value: String(stats.total),
      hint: "leads + clients",
      icon: Users,
      accent: "bg-slate-500/10 text-slate-700",
      scrollTo: "pipeline",
    },
    {
      key: "prospects",
      label: "Prospects",
      value: String(stats.prospects),
      hint: "awaiting first contact",
      icon: Radar,
      accent: "bg-sky-500/10 text-sky-700",
      scrollTo: "pipeline",
    },
    {
      key: "active",
      label: "Active",
      value: String(stats.active),
      hint: "contacted → built",
      icon: Activity,
      accent: "bg-violet-500/10 text-violet-700",
      scrollTo: "pipeline",
    },
    {
      key: "live",
      label: "Live sites",
      value: String(stats.live),
      hint: "deployed & indexed",
      icon: Gauge,
      accent: "bg-emerald-500/10 text-emerald-700",
      scrollTo: "pipeline",
    },
    {
      key: "won",
      label: "Won",
      value: String(stats.won),
      hint: "paying clients",
      icon: Trophy,
      accent: "bg-green-600/10 text-green-800",
      scrollTo: "pipeline",
    },
    {
      key: "playbook",
      label: "Playbook",
      value: `${stats.playbookPercent}%`,
      hint: `${stats.playbookDone} of ${stats.playbookTotal} steps —
Open CRM`,
      icon: ListChecks,
      accent: "bg-amber-500/12 text-amber-800",
      scrollTo: "pipeline",
      external: true,
    },
  ];

  return (
    <section
      aria-label="Pipeline overview"
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6",
        className,
      )}
    >
      {items.map((item, index) => (
        <button
          key={item.key}
          type="button"
          onClick={() =>
            item.external
              ? window.open("https://local-launch-crm.vercel.app", "_blank")
              : scrollTo(item.scrollTo)
          }
          className={cn(
            glass,
            "animate-rise-in cursor-pointer p-4 text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
          )}
          style={{ animationDelay: `${index * 45}ms` }}
        >
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg",
              item.accent,
            )}
            aria-hidden
          >
            <item.icon className="size-4" />
          </span>
          <p className="tnum mt-3 text-2xl leading-none font-bold tracking-tight text-slate-900">
            {item.value}
          </p>
          <p className="mt-1.5 text-xs font-medium text-slate-700">
            {item.label}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {item.hint}
          </p>
        </button>
      ))}
    </section>
  );
}
