"use client";

import { AddLeadDialog } from "@/components/add-lead-dialog";
import { LeadsTable, type LeadRow } from "@/components/leads-table";
import { PageHero } from "@/components/page-hero";
import { usePipeline } from "@/hooks/use-pipeline";
import { daysSince, isLead } from "@/lib/data";

export default function LeadsPage() {
  const { companies: all, stages, loading, error, reload } = usePipeline();
  const companies = all.filter(isLead);

  const rows: LeadRow[] = companies.map((company) => ({
    company,
    daysSince: daysSince(company.lastUpdated ?? company.lastContact),
  }));

  return (
    <>
      <PageHero
        image="/art/clients.png"
        eyebrow="the directory"
        title="Leads"
        subtitle="Early-funnel companies — prospect through first response."
      />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {error ? <p className="mt-1 text-sm text-destructive">{error}</p> : null}
          </div>
          <AddLeadDialog stages={stages} onAdded={() => void reload()} />
        </div>

        <LeadsTable rows={rows} />
      </div>
    </>
  );
}
