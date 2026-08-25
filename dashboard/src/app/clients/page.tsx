"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AddLeadDialog } from "@/components/add-lead-dialog";
import { MotionBackground } from "@/components/motion-background";
import { StageFilter } from "@/components/stage-filter";
import { getCompanies, getStages } from "@/lib/data";

export default function ClientsPage() {
  const allCompanies = getCompanies();
  const stages = getStages();
  const [query, setQuery] = useState("");

  const companies = useMemo(() => {
    if (!query.trim()) return allCompanies;
    const q = query.toLowerCase();
    return allCompanies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.category ?? "").toLowerCase().includes(q) ||
        (c.location ?? "").toLowerCase().includes(q),
    );
  }, [allCompanies, query]);

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Clients
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Every company in the book of business, filterable by stage.
            </p>
          </div>
          <AddLeadDialog stages={stages} />
        </div>

        {/* Search — quickly check if a company is already in the dashboard */}
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, category, or location…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {query.trim() && companies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="font-medium text-slate-700">Not in the dashboard</p>
            <p className="mt-1 text-sm text-slate-500">
              No company matches &ldquo;{query}&rdquo;. Use &ldquo;Add lead&rdquo; above to
              bring them in.
            </p>
          </div>
        ) : (
          <StageFilter companies={companies} stages={stages} />
        )}
      </div>
    </>
  );
}
