import Link from "next/link";
import { ArrowRight, Banknote, Repeat, Sparkles, Wallet } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import {
  formatCurrency,
  getPlaybookProgress,
  type Company,
  type Revenue,
} from "@/lib/data";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * Money view. Recurring + one-time is summed from every company that has
 * reached the "won" stage; until one does, this shows the honest zero state
 * alongside the live clients that are closest to converting.
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
  const won = companies.filter((company) => company.stage === "sale");
  const annualRunRate = revenue.mrr * 12;
  const total = revenue.mrr + revenue.oneTime;

  /** Build & Launch — the shortest path to first revenue. */
  const nearest = companies
    .filter((company) => company.stage === "build-launch")
    .map((company) => ({
      company,
      progress: getPlaybookProgress(company.playbook),
    }))
    .sort((a, b) => b.progress.percent - a.progress.percent);

  return (
    <section className={cn(glass, "flex flex-col p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900">
            <Wallet className="size-4 text-emerald-600" aria-hidden />
            Revenue
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Booked from clients in the Won stage
          </p>
        </div>
        <span className="tnum rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
          {revenue.clientCount} paying
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MoneyTile
          icon={Repeat}
          label="Monthly recurring"
          value={formatCurrency(revenue.mrr)}
          accent="text-emerald-700 bg-emerald-500/10"
        />
        <MoneyTile
          icon={Banknote}
          label="One-time"
          value={formatCurrency(revenue.oneTime)}
          accent="text-sky-700 bg-sky-500/10"
        />
        <MoneyTile
          icon={Sparkles}
          label="Annual run rate"
          value={formatCurrency(annualRunRate)}
          accent="text-violet-700 bg-violet-500/10"
        />
      </div>

      {won.length > 0 ? (
        <ul className="mt-5 flex flex-col divide-y divide-slate-900/[0.06]">
          {won.map((company) => {
            const mrr = company.revenue?.mrr ?? 0;
            const oneTime = company.revenue?.oneTime ?? 0;
            return (
              <li
                key={company.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <Link
                  href={`/client/${company.id}`}
                  className="min-w-0 truncate text-sm font-medium text-slate-800 hover:text-emerald-700"
                >
                  {company.name}
                </Link>
                <span className="tnum shrink-0 text-sm font-semibold text-slate-900">
                  {formatCurrency(mrr)}
                  <span className="text-xs font-normal text-slate-500">/mo</span>
                  {oneTime > 0 ? (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      + {formatCurrency(oneTime)} setup
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-900/10 bg-white/40 p-4">
          <p className="text-sm font-medium text-slate-800">
            No paying clients booked yet.
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {total === 0
              ? "Move a client to Won and add a `revenue` block in data/pipeline.json to start tracking here."
              : "Revenue recorded without a matching Won client."}
          </p>

          {nearest.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                Closest to close
              </p>
              {nearest.map(({ company, progress }) => (
                <div key={company.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/client/${company.id}`}
                      className="group inline-flex min-w-0 items-center gap-1 truncate text-sm font-medium text-slate-800 hover:text-emerald-700"
                    >
                      {company.name}
                      <ArrowRight
                        className="size-3 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600"
                        aria-hidden
                      />
                    </Link>
                    <span className="tnum shrink-0 text-xs font-semibold text-slate-600">
                      {progress.done}/{progress.total}
                    </span>
                  </div>
                  <Progress
                    value={progress.percent}
                    className="h-1.5 bg-slate-900/[0.07]"
                    indicatorClassName="bg-gradient-to-r from-emerald-400 to-emerald-600"
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
    <div className="rounded-xl border border-white/70 bg-white/55 p-3.5">
      <span
        className={cn("grid size-7 place-items-center rounded-lg", accent)}
        aria-hidden
      >
        <Icon className="size-3.5" />
      </span>
      <p className="tnum mt-2.5 text-xl leading-none font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
