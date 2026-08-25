"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AddLeadDialog } from "@/components/add-lead-dialog";
import { MotionBackground } from "@/components/motion-background";
import { StageFilter } from "@/components/stage-filter";
import { usePipeline } from "@/hooks/use-pipeline";
import { isClient } from "@/lib/data";

export default function ClientsPage() {
  const { companies: live, stages: allStages, loading, error, reload } = usePipeline();
  const allCompanies = live.filter(isClient);
  const stages = allStages.filter((s) => allCompanies.some((c) => c.stage === s.id));
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
              Won and in-build companies only. Leads live on the Leads tab.
              {loading ? " Loading live list…" : ""}
            </p>
            {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
          </div>
          <AddLeadDialog stages={allStages} onAdded={() => void reload()} />
        </div>

        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a client by name, category, or location…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {allCompanies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="font-medium text-slate-700">
              {loading ? "Loading clients…" : "No won / in-build clients yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Prospects stay on Leads until they close. Check the pipeline or Approvals.
            </p>
          </div>
        ) : query.trim() && companies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="font-medium text-slate-700">Not a current client</p>
            <p className="mt-1 text-sm text-slate-500">
              No client matches “{query}”. Try the sidebar search to check Leads, or add them from Leads.
            </p>
          </div>
        ) : (
          <StageFilter companies={companies} stages={stages.length ? stages : allStages} />
        )}
      </div>
    </>
  );
}
