import {
  Circle,
  Clipboard,
  Hammer,
  Megaphone,
  MessageSquare,
  Phone,
  Rocket,
  Search,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { StageColor, StageId } from "@/lib/data";

/**
 * Tailwind scans for literal class strings, so every stage variant is spelled
 * out here rather than interpolated from the color name. Light-theme tuned:
 * tinted fills with dark text, never the reverse.
 */
export interface StageTheme {
  /** Pill / badge treatment. */
  pill: string;
  /** Solid dot or completed step marker. */
  dot: string;
  /** Text-only accent. */
  text: string;
  /** Soft tinted surface (column headers, gauges). */
  surface: string;
  /** Border accent on grouped sections. */
  border: string;
  /** Gradient bar for progress + column rails. */
  bar: string;
  /** Ring applied on card hover for the company's current stage. */
  glow: string;
}

const STAGE_THEMES: Record<StageColor, StageTheme> = {
  slate: {
    pill: "bg-slate-500/12 text-slate-700 ring-1 ring-inset ring-slate-500/20",
    dot: "bg-slate-500",
    text: "text-slate-700",
    surface: "bg-slate-500/8",
    border: "border-slate-400/40",
    bar: "bg-gradient-to-r from-slate-400 to-slate-500",
    glow: "hover:border-slate-300 hover:shadow-slate-500/15",
  },
  blue: {
    pill: "bg-blue-500/12 text-blue-700 ring-1 ring-inset ring-blue-500/20",
    dot: "bg-blue-500",
    text: "text-blue-700",
    surface: "bg-blue-500/8",
    border: "border-blue-400/40",
    bar: "bg-gradient-to-r from-blue-400 to-blue-600",
    glow: "hover:border-blue-300 hover:shadow-blue-500/15",
  },
  amber: {
    pill: "bg-amber-500/15 text-amber-800 ring-1 ring-inset ring-amber-500/25",
    dot: "bg-amber-500",
    text: "text-amber-800",
    surface: "bg-amber-500/10",
    border: "border-amber-400/40",
    bar: "bg-gradient-to-r from-amber-400 to-amber-500",
    glow: "hover:border-amber-300 hover:shadow-amber-500/15",
  },
  violet: {
    pill: "bg-violet-500/12 text-violet-700 ring-1 ring-inset ring-violet-500/20",
    dot: "bg-violet-500",
    text: "text-violet-700",
    surface: "bg-violet-500/8",
    border: "border-violet-400/40",
    bar: "bg-gradient-to-r from-violet-400 to-violet-600",
    glow: "hover:border-violet-300 hover:shadow-violet-500/15",
  },
  emerald: {
    pill: "bg-emerald-500/12 text-emerald-700 ring-1 ring-inset ring-emerald-500/20",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    surface: "bg-emerald-500/8",
    border: "border-emerald-400/40",
    bar: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    glow: "hover:border-emerald-300 hover:shadow-emerald-500/15",
  },
  green: {
    pill: "bg-green-600/12 text-green-800 ring-1 ring-inset ring-green-600/20",
    dot: "bg-green-600",
    text: "text-green-800",
    surface: "bg-green-600/8",
    border: "border-green-500/40",
    bar: "bg-gradient-to-r from-green-500 to-green-700",
    glow: "hover:border-green-300 hover:shadow-green-600/15",
  },
  sky: {
    pill: "bg-sky-500/12 text-sky-700 ring-1 ring-inset ring-sky-500/20",
    dot: "bg-sky-500",
    text: "text-sky-700",
    surface: "bg-sky-500/8",
    border: "border-sky-400/40",
    bar: "bg-gradient-to-r from-sky-400 to-sky-600",
    glow: "hover:border-sky-300 hover:shadow-sky-500/15",
  },
};

export function stageTheme(color: StageColor): StageTheme {
  return STAGE_THEMES[color] ?? STAGE_THEMES.slate;
}

const STAGE_ICONS: Record<string, LucideIcon> = {
  Search,
  Phone,
  Clipboard,
  Megaphone,
  MessageSquare,
  Trophy,
  Rocket,
  Hammer,
};

export function stageIcon(name: string): LucideIcon {
  return STAGE_ICONS[name] ?? Circle;
}

/**
 * Stages where work is actively moving. Their pills pulse on the cards; the
 * bookend stages (untouched prospect, closed win) sit still.
 */
const IN_PROGRESS_STAGES: StageId[] = ["audit", "pitch", "contacted", "response"];

export function isInProgress(stage: StageId): boolean {
  return IN_PROGRESS_STAGES.includes(stage);
}

/* -------------------------------------------------------------- priority --- */

export interface PriorityTheme {
  badge: string;
  dot: string;
  /** Text colour for outline icons (Tailwind needs the literal string). */
  icon: string;
  /** Sort weight — higher lands first in "today's tasks". */
  weight: number;
}

const PRIORITY_THEMES: Record<string, PriorityTheme> = {
  high: {
    badge: "bg-rose-500/12 text-rose-700 ring-1 ring-inset ring-rose-500/20",
    dot: "bg-rose-500",
    icon: "text-rose-500",
    weight: 4,
  },
  "medium-high": {
    badge:
      "bg-orange-500/12 text-orange-700 ring-1 ring-inset ring-orange-500/20",
    dot: "bg-orange-500",
    icon: "text-orange-500",
    weight: 3,
  },
  medium: {
    badge: "bg-amber-500/15 text-amber-800 ring-1 ring-inset ring-amber-500/25",
    dot: "bg-amber-500",
    icon: "text-amber-500",
    weight: 2,
  },
  low: {
    badge: "bg-sky-500/12 text-sky-700 ring-1 ring-inset ring-sky-500/20",
    dot: "bg-sky-500",
    icon: "text-sky-500",
    weight: 1,
  },
};

const FALLBACK_PRIORITY: PriorityTheme = {
  badge: "bg-slate-500/12 text-slate-700 ring-1 ring-inset ring-slate-500/20",
  dot: "bg-slate-400",
  icon: "text-slate-400",
  weight: 0,
};

export function priorityTheme(priority: string): PriorityTheme {
  return PRIORITY_THEMES[priority.toLowerCase()] ?? FALLBACK_PRIORITY;
}

export function priorityWeight(priority: string): number {
  return priorityTheme(priority).weight;
}

/** "medium-high" -> "Medium-High" */
export function formatPriority(priority: string): string {
  return priority
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

/* ------------------------------------------------------------- seo score --- */

/** Colour ramp for the G-SCORE gauge: red -> amber -> emerald. */
export function scoreTheme(percent: number): {
  stroke: string;
  text: string;
  label: string;
} {
  if (percent >= 70) {
    return { stroke: "#059669", text: "text-emerald-700", label: "Strong" };
  }
  if (percent >= 40) {
    return { stroke: "#d97706", text: "text-amber-700", label: "Developing" };
  }
  if (percent >= 20) {
    return { stroke: "#ea580c", text: "text-orange-700", label: "Weak" };
  }
  return { stroke: "#e11d48", text: "text-rose-700", label: "Critical" };
}
