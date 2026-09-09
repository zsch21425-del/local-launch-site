"use client";

import * as React from "react";
import { type LucideIcon } from "lucide-react";

type Tone = "violet" | "cyan" | "teal" | "magenta";

const tones: Record<
  Tone,
  { icon: string; bar: string; glow: string }
> = {
  violet: {
    icon: "bg-violet-500/15 text-violet-300",
    bar: "bg-gradient-to-r from-violet-500 to-indigo-400",
    glow: "shadow-[0_0_28px_-8px_rgba(139,92,246,0.55)]",
  },
  cyan: {
    icon: "bg-cyan-500/15 text-cyan-300",
    bar: "bg-gradient-to-r from-cyan-500 to-sky-400",
    glow: "shadow-[0_0_28px_-8px_rgba(34,211,238,0.5)]",
  },
  teal: {
    icon: "bg-teal-500/15 text-teal-300",
    bar: "bg-gradient-to-r from-teal-500 to-emerald-400",
    glow: "shadow-[0_0_28px_-8px_rgba(45,212,191,0.5)]",
  },
  magenta: {
    icon: "bg-fuchsia-500/15 text-fuchsia-300",
    bar: "bg-gradient-to-r from-fuchsia-500 to-pink-400",
    glow: "shadow-[0_0_28px_-8px_rgba(232,121,249,0.5)]",
  },
};

export function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone,
  progress,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: Tone;
  progress: number;
}) {
  const t = tones[tone];
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900 p-5 transition-colors hover:border-slate-600/80">
      <div className="flex items-center justify-between">
        <span className={`grid size-9 place-items-center rounded-lg ${t.icon} ${t.glow}`}>
          <Icon className="size-4" />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-4 text-4xl font-bold tracking-tight text-foreground tabular-nums">
        {value}
      </div>
      <div className="mt-1.5 text-sm text-muted-foreground">{note}</div>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-1 rounded-full ${t.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
