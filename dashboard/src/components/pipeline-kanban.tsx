"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { MoveHorizontal } from "lucide-react";

import { StageColumn } from "@/components/stage-column";
import { companyRegion, type Company, type RegionId, type Stage, type StageId } from "@/lib/data";
import { cn } from "@/lib/utils";

type Filter = "all" | StageId;
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

/**
 * Pipeline board with stage focus + territory filter.
 * - Default view = SC focus (Upstate + rest of SC). Expansion book
 *   (out-of-state + unknown location) is one click away, not the daily view.
 * - All: full kanban for the active territory. One stage: that column wide +
 *   other stages as slim drop targets (so drag-out still works).
 * Deep-link: ?stage=contacted&region=all or #stage=contacted
 */
export function PipelineKanban({
  stages,
  companies,
  onMove,
}: {
  stages: Stage[];
  companies: Company[];
  onMove: (companyId: string, stage: StageId, index: number) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [region, setRegion] = useState<RegionFilter>("sc");

  // Read ?stage=/&region= or #stage= once on mount + when URL changes
  useEffect(() => {
    function read() {
      try {
        const sp = new URLSearchParams(window.location.search);
        let s = sp.get("stage");
        if (!s && window.location.hash.startsWith("#stage=")) {
          s = window.location.hash.slice("#stage=".length);
        }
        if (s === "all" || !s) {
          setFilter("all");
        } else if (stages.some((st) => st.id === s)) {
          setFilter(s as StageId);
        }
        const r = sp.get("region");
        if (
          r === "sc" ||
          r === "upstate" ||
          r === "all" ||
          r === "out-of-state"
        ) {
          setRegion(r);
        }
      } catch {
        /* ignore */
      }
    }
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [stages]);

  function setFilterAndUrl(next: Filter) {
    setFilter(next);
    try {
      const url = new URL(window.location.href);
      if (next === "all") {
        url.searchParams.delete("stage");
      } else {
        url.searchParams.set("stage", next);
      }
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch {
      /* ignore */
    }
  }

  function setRegionAndUrl(next: RegionFilter) {
    setRegion(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("region", next);
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch {
      /* ignore */
    }
  }

  const scoped = useMemo(
    () => companies.filter((c) => matchesRegion(c, region)),
    [companies, region],
  );

  const regionCounts = useMemo(() => {
    const m: Record<RegionFilter, number> = {
      sc: 0,
      upstate: 0,
      all: companies.length,
      "out-of-state": 0,
    };
    for (const c of companies) {
      if (matchesRegion(c, "upstate")) m.upstate += 1;
      if (matchesRegion(c, "sc")) m.sc += 1;
      if (matchesRegion(c, "out-of-state")) m["out-of-state"] += 1;
    }
    return m;
  }, [companies]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of scoped) {
      m[c.stage] = (m[c.stage] ?? 0) + 1;
    }
    return m;
  }, [scoped]);

  function handleDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;
    onMove(draggableId, destination.droppableId as StageId, destination.index);
  }

  const visibleStages =
    filter === "all" ? stages : stages; /* always render droppables */

  return (
    <div className="flex flex-col gap-3">
      {/* Territory scope — SC focus is the daily view, expansion one click away */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Territory
        </span>
        {(["sc", "upstate", "all", "out-of-state"] as const).map((r) => (
          <Chip
            key={r}
            active={region === r}
            onClick={() => setRegionAndUrl(r)}
            label={REGION_LABEL[r]}
            count={regionCounts[r]}
          />
        ))}
        {region !== "sc" ? (
          <span className="ml-1 text-[11px] text-muted-foreground">
            {region === "all"
              ? "Full book incl. expansion"
              : region === "upstate"
                ? "Upstate SC only"
                : "Expansion book — out-of-state + unknown location"}
          </span>
        ) : null}
      </div>

      {/* Stage focus chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Focus
        </span>
        <Chip
          active={filter === "all"}
          onClick={() => setFilterAndUrl("all")}
          label="All"
          count={scoped.length}
        />
        {stages.map((st) => (
          <Chip
            key={st.id}
            active={filter === st.id}
            onClick={() => setFilterAndUrl(st.id)}
            label={st.label}
            count={counts[st.id] ?? 0}
          />
        ))}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="kanban-scroll -mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
          <div
            className={cn(
              "flex items-stretch gap-3 sm:gap-4",
              filter !== "all" && "min-h-[420px]",
            )}
          >
            {visibleStages.map((stage) => {
              const focused = filter === "all" || filter === stage.id;
              const stageCompanies = scoped.filter(
                (company) => company.stage === stage.id,
              );

              if (filter !== "all" && !focused) {
                // Slim drop target so you can drag OUT of the focused column
                return (
                  <div
                    key={stage.id}
                    className="flex w-[7.5rem] shrink-0 flex-col"
                  >
                    <StageColumn
                      stage={stage}
                      companies={[]}
                      compact
                      emptyHint={`Drop → ${stage.label}`}
                      badgeCount={stageCompanies.length}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={stage.id}
                  className={cn(
                    "flex shrink-0 flex-col",
                    filter === "all" ? "w-[280px]" : "w-[min(100%,420px)] flex-1",
                  )}
                >
                  <StageColumn stage={stage} companies={stageCompanies} />
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MoveHorizontal className="size-3.5 text-muted-foreground" aria-hidden />
          {filter === "all"
            ? "Drag by the grip to move stages. Saved live."
            : `Focused on ${stages.find((s) => s.id === filter)?.label ?? filter}. Drag to a slim column to change stage.`}
        </p>
      </DragDropContext>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ring-1",
        active
          ? "bg-primary text-white ring-ring"
          : "bg-card/80 text-muted-foreground ring-border hover:bg-card hover:ring-ring",
      )}
    >
      {label}
      <span
        className={cn(
          "tnum rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          active ? "bg-card/20 text-white" : "bg-muted text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}
