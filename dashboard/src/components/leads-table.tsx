"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Filter, Inbox, Search } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { StagePill } from "@/components/stage-pill";
import {
  companyRegion,
  getStage,
  type Company,
  type RegionId,
} from "@/lib/data";
import { formatPriority } from "@/lib/stages";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const ALL = "all";
type RegionFilter = "sc" | "upstate" | "all" | "out-of-state";

const REGION_LABEL: Record<RegionFilter, string> = {
  sc: "SC focus",
  upstate: "Upstate",
  all: "Everywhere",
  "out-of-state": "Expansion",
};

function matchesRegion(company: Company, region: RegionFilter): boolean {
  if (region === "all") return true;
  const r: RegionId = companyRegion(company);
  if (region === "upstate") return r === "upstate";
  if (region === "sc") return r === "upstate" || r === "sc";
  return r === "out-of-state" || r === "unknown";
}

const SELECT =
  "rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary/40 focus:ring-2 focus:ring-ring/20 focus:outline-none";

export interface LeadRow {
  company: Company;
  daysSince: number | null;
}

/** Filterable table of every company in the pipeline. Filtering only — dates are computed server-side. */
export function LeadsTable({ rows }: { rows: LeadRow[] }) {
  const [priority, setPriority] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [region, setRegion] = useState<RegionFilter>("sc");
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
    if (!matchesRegion(row.company, region)) return false;
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
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, city…"
            className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Filter className="size-3.5" aria-hidden />
          Filter
        </span>
        <select
          value={region}
          onChange={(event) => setRegion(event.target.value as RegionFilter)}
          className={SELECT}
          aria-label="Filter by territory"
          title="SC focus = Upstate + rest of SC. Expansion = out-of-state + unknown."
        >
          {(Object.keys(REGION_LABEL) as RegionFilter[]).map((r) => (
            <option key={r} value={r}>
              {REGION_LABEL[r]}
            </option>
          ))}
        </select>
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
        <span className="tnum ml-auto text-xs text-muted-foreground">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <Inbox className="size-5 text-muted-foreground/60" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {query.trim()
              ? `No lead matches “${query}”. They’re not in this list — try the sidebar search or add them.`
              : "No leads match these filters."}
          </p>
        </div>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
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
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted"
                  >
                    <td className="py-2.5 pr-3 font-medium text-foreground">
                      <Link
                        href={`/client/${company.id}`}
                        className="group inline-flex items-center gap-1 hover:text-primary"
                      >
                        {company.name}
                        <ArrowUpRight className="size-3 text-muted-foreground/60 transition-colors group-hover:text-primary" />
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{company.category}</td>
                    <td className="py-2.5 pr-3">
                      {stage ? <StagePill stage={stage} size="sm" /> : null}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {company.phone || "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <PriorityBadge priority={company.priority} />
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {company.prospectScore ?? "—"}
                    </td>
                    <td className="tnum py-2.5 pr-3 text-right text-muted-foreground">
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
