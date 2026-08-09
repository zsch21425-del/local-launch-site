import { AddLeadDialog } from "@/components/add-lead-dialog";
import { MotionBackground } from "@/components/motion-background";
import { StageFilter } from "@/components/stage-filter";
import { getCompanies, getStages } from "@/lib/data";

export default function ClientsPage() {
  const companies = getCompanies();
  const stages = getStages();

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

        <StageFilter companies={companies} stages={stages} />
      </div>
    </>
  );
}
