import { FileText } from "lucide-react";

import type { Company } from "@/lib/data";
import { glassCard } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** What the client does, plus prospect score when the company hasn't been audited yet. */
export function ClientSummary({
  company,
  className,
}: {
  company: Company;
  className?: string;
}) {
  return (
    <div className={cn(glassCard, "flex flex-col gap-3 p-5", className)}>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <FileText className="size-4 text-muted-foreground" aria-hidden />
        Summary
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{company.summary}</p>

      {company.prospectScore ? (
        <div className="mt-1 flex items-center justify-between rounded-lg bg-foreground/[0.03] px-3 py-2 text-xs">
          <span className="font-medium text-muted-foreground">Prospect score</span>
          <span className="font-semibold text-foreground">
            {company.prospectScore}
          </span>
        </div>
      ) : null}
    </div>
  );
}
