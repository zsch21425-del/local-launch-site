"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ClipboardCheck,
  MonitorPlay,
  Phone,
  Radar,
} from "lucide-react";

import type { WorkInbox, WorkItem } from "@/lib/data";
import { formatPriority, priorityTheme } from "@/lib/stages";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** Command-center strip: what Zach should do next, not a backlog dump. */
export function WorkInboxPanel({ inbox }: { inbox: WorkInbox }) {
  const waiting = inbox.pitches + inbox.demos;
  const next = [...inbox.highLeads, ...inbox.stale].slice(0, 8);

  return (
    <section id="inbox" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className={cn(glass, "flex flex-col gap-3 p-5")}>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Needs you
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Work waiting on your decision — not the whole pipeline.
          </p>
        </div>

        <Link
          href="/approvals"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 transition-colors hover:border-emerald-400/50 hover:bg-white"
        >
          <span className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-700">
              <ClipboardCheck className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Pitch approvals
              </span>
              <span className="text-[11px] text-slate-500">Review and send</span>
            </span>
          </span>
          <span className="tnum rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            {inbox.pitches}
          </span>
        </Link>

        <Link
          href="/demos"
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-3.5 py-3 transition-colors hover:border-emerald-400/50 hover:bg-white"
        >
          <span className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-sky-500/10 text-sky-700">
              <MonitorPlay className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-medium text-slate-800">
                Demo reviews
              </span>
              <span className="text-[11px] text-slate-500">Live sites ready to check</span>
            </span>
          </span>
          <span className="tnum rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            {inbox.demos}
          </span>
        </Link>

        {waiting === 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            No approvals sitting in queue.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            {waiting} item{waiting === 1 ? "" : "s"} waiting on you.
          </p>
        )}
      </div>

      <div className={cn(glass, "flex flex-col p-5")}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Next to touch
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              High-priority leads, then stalled follow-ups.
            </p>
          </div>
          <Link
            href="/leads"
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            All leads →
          </Link>
        </div>

        {next.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 py-8 text-center">
            <CheckCircle2 className="size-5 text-emerald-500" />
            <p className="text-sm font-medium text-slate-700">Inbox is clear.</p>
          </div>
        ) : (
          <ol className="divide-y divide-slate-900/[0.06]">
            {next.map((item) => (
              <WorkRow key={item.id} item={item} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function WorkRow({ item }: { item: WorkItem }) {
  const theme = priorityTheme(item.priority);
  const Icon = item.kind === "follow-up" ? Phone : Radar;
  return (
    <li>
      <Link
        href={item.href}
        className="group -mx-1 flex items-start gap-3 rounded-lg px-1 py-2.5 hover:bg-white/70"
      >
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-md",
            theme.badge,
          )}
        >
          <Icon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800 group-hover:text-emerald-700">
            {item.companyName}
          </span>
          <span className="block truncate text-[11px] text-slate-500">
            {item.title}
            {item.detail ? ` · ${item.detail}` : ""}
          </span>
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", theme.badge)}>
          {formatPriority(item.priority)}
        </span>
      </Link>
    </li>
  );
}
