"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Filter, Inbox, Search } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { StagePill } from "@/components/stage-pill";
import { getStage, type Company } from "@/lib/data";
import { formatPriority } from "@/lib/stages";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const ALL = "all";

const SELECT =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none";

export interface LeadRow {
  company: Company;
  daysSince: number | null;
}

/** Filterable table of every company in the pipeline. Filtering only — dates are computed server-side. */
export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  const [priority, setPriority] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  const priorities = useMemo(
    () => Array.from(new Set(rows.map((row) => row.company.priority))),
    [rows],
  );
  const categories = useMemo(
    () => Array.from(new Set(rows.map((row) => row.company.category))).sort(),
    [rows],
  );

  const filtered = rows.filter((row) => {
    if (priority !== ALL && row.company.priority !== priority) return false;
    if (category !== ALL && row.company.category !== category) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const c = row.company;
      const hay = [c.name, c.category, c.location, c.phone, c.website]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className={cn(glass, "flex flex-col gap-4 p-5")}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, city…"
            className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Filter className="size-3.5" aria-hidden />
          Filter
        </span>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          className={SELECT}
          aria-label="Filter by priority"
        >
          <option value={ALL}>All priorities</option>
          {priorities.map((option) => (
            <option key={option} value={option}>
              {formatPriority(option)}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className={SELECT}
          aria-label="Filter by category"
        >
          <option value={ALL}>All categories</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="tnum ml-auto text-xs text-slate-400">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 py-12 text-center">
          <Inbox className="size-5 text-slate-300" aria-hidden />
          <p className="text-sm text-slate-500">
            {query.trim()
              ? `No lead matches “${query}”. They’re not in this list — try the sidebar search or add them.`
              : "No leads match these filters."}
          </p>
        </div>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Stage</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Prospect score</th>
                <th className="py-2 pr-3 text-right">Days since added</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ company, daysSince }) => {
                const stage = getStage(company.stage);
                return (
                  <tr
                    key={company.id}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="py-2.5 pr-3 font-medium text-slate-800">
                      <Link
                        href={`/client/${company.id}`}
                        className="group inline-flex items-center gap-1 hover:text-emerald-700"
                      >
                        {company.name}
                        <ArrowUpRight className="size-3 text-slate-300 transition-colors group-hover:text-emerald-600" />
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500">{company.category}</td>
                    <td className="py-2.5 pr-3">
                      {stage ? <StagePill stage={stage} size="sm" /> : null}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {company.phone || "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <PriorityBadge priority={company.priority} />
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {company.prospectScore ?? "—"}
                    </td>
                    <td className="tnum py-2.5 pr-3 text-right text-slate-500">
                      {daysSince === null ? "—" : `${daysSince}d`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
