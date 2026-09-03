import Link from "next/link";
import { ArrowUpRight, CalendarClock, ExternalLink, GripVertical, MapPin, MailCheck, MailX, Send, User } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { ProgressRing } from "@/components/progress-ring";
import {
  formatDate,
  getPlaybookProgress,
  initials,
  resolveDemoUrl,
  type Company,
  type Stage,
} from "@/lib/data";
import { stageTheme } from "@/lib/stages";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Send-status derived from the company record. `responseStatus` is the single
 * source of truth for "have we emailed this lead yet" — kept in sync with the
 * Sent folder so we never double-send.
 */
function sendState(company: Company): {
  label: string;
  tone: "sent" | "bounced" | "awaiting" | "none";
} {
  const rs = (company.responseStatus ?? "").toLowerCase().trim();
  if (rs === "pitch-sent" || rs === "sent" || rs === "contacted") {
    return { label: "Sent", tone: "sent" };
  }
  if (rs === "bounced" || rs.includes("bounce")) {
    return { label: "Bounced", tone: "bounced" };
  }
  if (rs === "awaiting" || rs.includes("await")) {
    return { label: "Awaiting", tone: "awaiting" };
  }
  return { label: "Not sent", tone: "none" };
}

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
  const progress = getPlaybookProgress(company.playbook ?? []);
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

          {/* Cold-call facts: owner name + offer tier, at a glance. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-600">
            {company.ownerName ? (
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <User className="size-3 text-slate-400" aria-hidden />
                {company.ownerName}
              </span>
            ) : null}
            {company.offer ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1",
                  company.offer.includes("599")
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-sky-50 text-sky-700 ring-sky-200",
                )}
              >
                {company.offer}
              </span>
            ) : null}
          </div>

          {/* Send status + demo link — the anti-double-send row. */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <SendStatusBadge company={company} />
            <DemoLink company={company} />
          </div>
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
 * Send-status badge. One glance tells Zach whether this lead has been emailed,
 * bounced, or is still pending — the anti-double-send signal.
 */
function SendStatusBadge({ company }: { company: Company }) {
  const s = sendState(company);
  const styles: Record<string, string> = {
    sent: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    bounced: "bg-red-50 text-red-700 ring-red-200",
    awaiting: "bg-amber-50 text-amber-700 ring-amber-200",
    none: "bg-slate-50 text-slate-500 ring-slate-200",
  };
  const Icon = s.tone === "sent" ? MailCheck : s.tone === "bounced" ? MailX : Send;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1",
        styles[s.tone],
      )}
    >
      <Icon className="size-3" aria-hidden />
      {s.label}
    </span>
  );
}

/**
 * Demo link — only rendered when a real demo URL is known (explicit
 * `demo.url`/`demoUrl` or a verified `website` pointing at our Vercel demo).
 * Opens in a new tab so the card's own navigation link isn't hijacked.
 */
function DemoLink({ company }: { company: Company }) {
  const url = company.demoUrl ?? company.demo?.url ?? company.website;
  if (!url) return null;
  const isDemo = url.includes("vercel.app") || url.includes("demo");
  if (!isDemo) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="relative z-10 inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-600/20 transition-colors hover:bg-emerald-600/20"
      title={url}
    >
      <ExternalLink className="size-3" aria-hidden />
      Demo
    </a>
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
