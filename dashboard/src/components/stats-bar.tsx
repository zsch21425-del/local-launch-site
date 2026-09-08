"use client";

import type { PipelineStats } from "@/lib/data";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Compact header stats — send-truth aware (not vanity "we sent 31").
 */
export function StatsBar({
  stats,
  ops,
  className,
}: {
  stats: PipelineStats;
  ops?: {
    sendNow: number;
    awaitingReply: number;
    clients: number;
    inReview: number;
    sentUnverified?: number;
    sentBounced?: number;
    bounceRisk?: number;
  };
  className?: string;
}) {
  const items = [
    {
      label: "Total",
      value: String(stats.total),
      hint: "in book",
    },
    {
      label: "In Sent",
      value: String(ops?.sentUnverified ?? 0),
      hint: "matched Sent · not bounce-proof",
    },
    {
      label: "Bounced",
      value: String(ops?.sentBounced ?? 0),
      hint: "dead mailbox / DSN",
    },
    {
      label: "Dead MX",
      value: String(ops?.bounceRisk ?? 0),
      hint: "no MX — never send",
    },
    {
      label: "Send now",
      value: String(ops?.sendNow ?? 0),
      hint: "approved + MX OK",
    },
    {
      label: "Clients",
      value: String(ops?.clients ?? stats.live),
      hint: "build-launch",
    },
  ];

  return (
    <section
      aria-label="Ops snapshot"
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6",
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(glass, "animate-rise-in p-4")}
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <p className="tnum text-2xl leading-none font-bold tracking-tight text-slate-900">
            {item.value}
          </p>
          <p className="mt-1.5 text-xs font-medium text-slate-700">
            {item.label}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{item.hint}</p>
        </div>
      ))}
    </section>
  );
}
