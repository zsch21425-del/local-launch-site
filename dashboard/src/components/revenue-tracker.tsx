import Link from "next/link";
import { ArrowRight, Banknote, Repeat, Sparkles, Wallet } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import {
  CLIENT_STAGES,
  formatCurrency,
  getPlaybookProgress,
  type Company,
  type Revenue,
} from "@/lib/data";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Money view. Booked (stage-derived, NOT paid/MRR truth): recurring + one-time
 * is summed from every closed client — `sale` AND `build-launch` (M15). The
 * per-client breakdown lists closed clients that carry a `revenue` block; until
 * one does, this shows the honest zero state alongside the clients closest to
 * converting.
 */
export function RevenueTracker({
  revenue,
  companies,
  className,
}: {
  revenue: Revenue;
  companies: Company[];
  className?: string;
}) {
  const booked = companies
    .filter((company) => CLIENT_STAGES.includes(company.stage))
    .filter(
      (company) =>
        (company.revenue?.mrr ?? 0) > 0 || (company.revenue?.oneTime ?? 0) > 0,
    );
  const annualRunRate = revenue.mrr * 12;
  const total = revenue.mrr + revenue.oneTime;

  /** Build & Launch — the shortest path to first revenue. */
  const nearest = companies
    .filter((company) => company.stage === "build-launch")
    .map((company) => ({
      company,
      progress: getPlaybookProgress(company.playbook ?? []),
    }))
    .sort((a, b) => b.progress.percent - a.progress.percent);

  return (
    <section className={cn(glass, "flex flex-col p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
            <Wallet className="size-4 text-primary" aria-hidden />
            Revenue
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Booked from closed clients (Sale + Build &amp; Launch) — stage-derived,
            not billed
          </p>
        </div>
        <span className="tnum rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-inset ring-ring/20">
          {revenue.clientCount} closed
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MoneyTile
          icon={Repeat}
          label="Monthly recurring"
          value={formatCurrency(revenue.mrr)}
          accent="text-primary bg-primary/10"
        />
        <MoneyTile
          icon={Banknote}
          label="One-time"
          value={formatCurrency(revenue.oneTime)}
          accent="text-sky-300 bg-sky-500/10"
        />
        <MoneyTile
          icon={Sparkles}
          label="Annual run rate"
          value={formatCurrency(annualRunRate)}
          accent="text-violet-300 bg-violet-500/10"
        />
      </div>

      {booked.length > 0 ? (
        <ul className="mt-5 flex flex-col divide-y divide-border/[0.06]">
          {booked.map((company) => {
            const mrr = company.revenue?.mrr ?? 0;
            const oneTime = company.revenue?.oneTime ?? 0;
            return (
              <li
                key={company.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <Link
                  href={`/client/${company.id}`}
                  className="min-w-0 truncate text-sm font-medium text-foreground hover:text-primary"
                >
                  {company.name}
                </Link>
                <span className="tnum shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(mrr)}
                  <span className="text-xs font-normal text-muted-foreground">/mo</span>
                  {oneTime > 0 ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      + {formatCurrency(oneTime)} setup
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-foreground/10 bg-card/40 p-4">
          <p className="text-sm font-medium text-foreground">
            No revenue recorded on closed clients yet.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {total === 0
              ? "Add a `revenue` block to a Sale / Build & Launch client in the pipeline to start tracking booked revenue here."
              : "Revenue recorded without a matching closed client."}
          </p>

          {nearest.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Closest to close
              </p>
              {nearest.map(({ company, progress }) => (
                <div key={company.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/client/${company.id}`}
                      className="group inline-flex min-w-0 items-center gap-1 truncate text-sm font-medium text-foreground hover:text-primary"
                    >
                      {company.name}
                      <ArrowRight
                        className="size-3 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                        aria-hidden
                      />
                    </Link>
                    <span className="tnum shrink-0 text-xs font-semibold text-muted-foreground">
                      {progress.done}/{progress.total}
                    </span>
                  </div>
                  <Progress
                    value={progress.percent}
                    className="h-1.5 bg-foreground/[0.07]"
                    indicatorClassName="bg-gradient-to-r from-primary to-primary"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MoneyTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-card/70 bg-card/55 p-3.5">
      <span
        className={cn("grid size-7 place-items-center rounded-lg", accent)}
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>
      <p className="tnum mt-2.5 text-xl leading-none font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
