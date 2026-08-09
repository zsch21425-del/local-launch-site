import Link from "next/link";
import { ArrowUpRight, CalendarClock, GripVertical, MapPin } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { ProgressRing } from "@/components/progress-ring";
import {
  formatDate,
  getPlaybookProgress,
  initials,
  type Company,
  type Stage,
} from "@/lib/data";
import { stageTheme } from "@/lib/stages";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Glass card shown inside a kanban column. Presentational only — the drag
 * plumbing lives in `stage-column.tsx`, which wraps this in a `<Draggable>`.
 */
export function CompanyCard({
  company,
  stage,
  isDragging = false,
  dragHandleSlot,
  className,
}: {
  company: Company;
  stage: Stage;
  isDragging?: boolean;
  /** Rendered where the grip icon sits — receives the dnd drag-handle props. */
  dragHandleSlot?: React.ReactNode;
  className?: string;
}) {
  const theme = stageTheme(stage.color);
  const progress = getPlaybookProgress(company.playbook);
  const updated = formatDate(company.lastUpdated ?? company.lastContact);

  return (
    <article
      className={cn(
        glassCard,
        "group relative p-3.5 transition-all duration-200",
        isDragging
          ? "rotate-[1.5deg] scale-[1.02] shadow-[0_20px_45px_-12px_rgba(15,23,42,0.35)] ring-2 ring-emerald-500/30"
          : "hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-14px_rgba(15,23,42,0.32)]",
        theme.glow,
        className,
      )}
    >
      {/* Stage colour rail. */}
      <span
        className={cn(
          "absolute inset-y-3 left-0 w-[3px] rounded-full",
          theme.bar,
        )}
        aria-hidden
      />

      <div className="flex items-start gap-3 pl-2.5">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold tracking-tight",
            theme.surface,
            theme.text,
          )}
          aria-hidden
        >
          {initials(company.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/client/${company.id}`}
              className="focus-visible:ring-ring/50 min-w-0 rounded-sm text-sm leading-snug font-semibold text-slate-900 outline-none after:absolute after:inset-0 after:content-[''] hover:text-emerald-700 focus-visible:ring-2"
            >
              {company.name}
            </Link>
            <span className="flex shrink-0 items-center gap-0.5">
              <ArrowUpRight
                className="size-3.5 text-slate-300 transition-colors group-hover:text-emerald-600"
                aria-hidden
              />
              {/* Sits above the card-wide link overlay so drags register. */}
              {dragHandleSlot ? (
                <span className="relative z-10">{dragHandleSlot}</span>
              ) : null}
            </span>
          </div>

          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {company.category}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-2.5">
        <PriorityBadge priority={company.priority} />
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
          <MapPin className="size-3 text-slate-400" aria-hidden />
          {company.location}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-900/[0.06] pt-3 pl-2.5">
        <div className="flex items-center gap-2.5">
          <ProgressRing
            value={progress.done}
            max={progress.total}
            size={34}
            label={`${progress.percent}`}
          />
          <div className="leading-tight">
            <p className="tnum text-xs font-semibold text-slate-800">
              {progress.done}/{progress.total}
            </p>
            <p className="text-[10px] tracking-wide text-slate-500 uppercase">
              Playbook
            </p>
          </div>
        </div>

        {updated ? (
          <span className="inline-flex items-center gap-1 text-[10px] whitespace-nowrap text-slate-400">
            <CalendarClock className="size-3" aria-hidden />
            {updated}
          </span>
        ) : null}
      </div>
    </article>
  );
}

/**
 * The grip affordance. This is the drag handle — everything else on the card is
 * covered by the navigation link, and drag sensors deliberately ignore drags
 * that start on an anchor. Padded out to a comfortable touch target.
 */
export function CardGrip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 -mr-1.5 place-items-center rounded-md text-slate-300 transition-colors hover:bg-slate-900/5 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none",
        className,
      )}
    >
      <GripVertical className="size-3.5" aria-hidden />
    </span>
  );
}
