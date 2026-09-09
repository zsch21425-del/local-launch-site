"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { resolveDemoUrl, type Company } from "@/lib/data";

/**
 * Compact rectangular company tile for the dashboard grid — name, badges, and
 * location in a wide row. The whole tile links to the client workstation.
 */
export function CompanyTile({ company }: { company: Company }) {
  const hasDemo = !!resolveDemoUrl(company);
  const hasPitch = !!company.pitchDraft;
  return (
    <Link
      href={`/client/${company.id}`}
      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-900 px-4 py-3 transition-all hover:border-violet-500/40 hover:shadow-[0_0_20px_-6px_rgba(139,92,246,0.35)]"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-[15px] text-foreground transition-colors group-hover:text-primary">
            {company.name}
          </h3>
          {hasDemo ? (
            <span className="shrink-0 rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-violet-300">
              Demo
            </span>
          ) : null}
          {hasPitch ? (
            <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
              Pitch
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {company.category} · {company.location}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <PriorityBadge priority={company.priority} />
        <ArrowUpRight className="size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
      </div>
    </Link>
  );
}
