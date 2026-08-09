"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { MoveHorizontal } from "lucide-react";

import { StageColumn } from "@/components/stage-column";
import type { Company, Stage, StageId } from "@/lib/data";

/**
 * The board. Stage membership is owned by `dashboard.tsx` so the stats bar and
 * revenue tracker stay in sync with whatever the user drags.
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
  function handleDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;

    onMove(draggableId, destination.droppableId as StageId, destination.index);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-scroll -mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
        <div className="flex items-stretch gap-3 sm:gap-4">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              companies={companies.filter(
                (company) => company.stage === stage.id,
              )}
            />
          ))}
        </div>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
        <MoveHorizontal className="size-3.5 text-slate-400" aria-hidden />
        Drag a card by its grip to move a client between stages. Moves are saved
        to this browser.
      </p>
    </DragDropContext>
  );
}
