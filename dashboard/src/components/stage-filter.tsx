"use client";

import { useMemo, useState } from "react";
import { Inbox, LayoutGrid } from "lucide-react";

import { CompanyCard } from "@/components/company-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Company, Stage } from "@/lib/data";
import { stageIcon, stageTheme } from "@/lib/stages";
import { cn } from "@/lib/utils";

const ALL = "all";

interface StageFilterProps {
  companies: Company[];
  stages: Stage[];
}

export function StageFilter({ companies, stages }: StageFilterProps) {
  const [selected, setSelected] = useState<string>(ALL);

  const counts = useMemo(() => {
    const next: Record<string, number> = {};
    for (const company of companies) {
      next[company.stage] = (next[company.stage] ?? 0) + 1;
    }
    return next;
  }, [companies]);

  const visible = useMemo(
    () =>
      selected === ALL
        ? companies
        : companies.filter((company) => company.stage === selected),
    [companies, selected],
  );

  const activeStage = stages.find((stage) => stage.id === selected);

  return (
    <Tabs value={selected} onValueChange={setSelected}>
      <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <TabsList>
          <TabsTrigger value={ALL}>
            <LayoutGrid />
            All
            <CountBadge count={companies.length} />
          </TabsTrigger>
          {stages.map((stage) => {
            const Icon = stageIcon(stage.icon);
            const count = counts[stage.id] ?? 0;
            return (
              <TabsTrigger
                key={stage.id}
                value={stage.id}
                className={cn(
                  selected === stage.id && stageTheme(stage.color).text,
                  count === 0 && "opacity-50",
                )}
              >
                <Icon />
                {stage.label}
                <CountBadge count={count} />
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              stage={stages.find((stage) => stage.id === company.stage) ?? stages[0]}
            />
          ))}
        </div>
      ) : (
        <div className="border-border/60 bg-card/40 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center">
          <Inbox className="text-muted-foreground size-7" />
          <p className="font-medium">
            No companies in {activeStage?.label ?? "this stage"}
          </p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Nothing has reached this stage yet. Move a company forward in{" "}
            <code className="text-foreground/80">data/pipeline.json</code> and it
            will show up here.
          </p>
        </div>
      )}
    </Tabs>
  );
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="bg-secondary/80 text-muted-foreground ml-0.5 rounded px-1.5 py-0.5 text-[11px] leading-none font-semibold tabular-nums">
      {count}
    </span>
  );
}
