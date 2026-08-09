import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { PriorityBadge } from "@/components/priority-badge";
import { StagePill } from "@/components/stage-pill";
import { Badge } from "@/components/ui/badge";
import type { Company, Stage } from "@/lib/data";

/** Back button, name, category/priority badges, and current stage pill. */
export function ClientHeader({
  company,
  stage,
}: {
  company: Company;
  stage: Stage;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/"
        className="group -ml-2 inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back to pipeline
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {company.name}
            </h1>
            <PriorityBadge priority={company.priority} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {company.location}
            </span>
            {company.category ? (
              <Badge variant="outline" className="text-xs">
                {company.category}
              </Badge>
            ) : null}
          </div>
        </div>
        <StagePill stage={stage} />
      </div>
    </div>
  );
}
