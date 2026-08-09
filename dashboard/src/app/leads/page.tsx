import { AddLeadDialog } from "@/components/add-lead-dialog";
import { LeadsTable, type LeadRow } from "@/components/leads-table";
import { MotionBackground } from "@/components/motion-background";
import { daysSince, getCompanies, getStages } from "@/lib/data";

export default function LeadsPage() {
  const companies = getCompanies();
  const stages = getStages();

  const rows: LeadRow[] = companies.map((company) => ({
    company,
    daysSince: daysSince(company.lastUpdated ?? company.lastContact),
  }));

  return (
    <>
      <MotionBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Leads
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Every prospected and active company in the pipeline.
            </p>
          </div>
          <AddLeadDialog stages={stages} />
        </div>

        <LeadsTable rows={rows} />
      </div>
    </>
  );
}
