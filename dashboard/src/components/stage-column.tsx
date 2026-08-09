"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Inbox } from "lucide-react";

import { CardGrip, CompanyCard } from "@/components/company-card";
import type { Company, Stage } from "@/lib/data";
import { stageIcon, stageTheme } from "@/lib/stages";
import { glassSubtle } from "@/lib/ui";
import { cn } from "@/lib/utils";

/** One pipeline stage: header, drop zone, and its draggable company cards. */
export function StageColumn({
  stage,
  companies,
}: {
  stage: Stage;
  companies: Company[];
}) {
  const theme = stageTheme(stage.color);
  const Icon = stageIcon(stage.icon);

  return (
    <div
      className={cn(
        glassSubtle,
        "flex w-[86vw] shrink-0 flex-col sm:w-[19rem]",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3.5 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-lg",
              theme.surface,
              theme.text,
            )}
            aria-hidden
          >
            <Icon className="size-3.5" />
          </span>
          <h3 className="truncate text-[13px] font-semibold tracking-tight text-slate-800">
            {stage.label}
          </h3>
        </div>
        <span
          className={cn(
            "tnum grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
            theme.pill,
          )}
        >
          {companies.length}
        </span>
      </div>

      <div className="px-3.5">
        <div className={cn("h-1 w-full rounded-full", theme.bar)} aria-hidden />
      </div>

      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex min-h-[8rem] flex-1 flex-col gap-2.5 rounded-b-2xl p-3 transition-colors duration-200",
              snapshot.isDraggingOver && "bg-emerald-500/[0.07]",
            )}
          >
            {companies.map((company, index) => (
              <Draggable
                key={company.id}
                draggableId={company.id}
                index={index}
              >
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                  >
                    <CompanyCard
                      company={company}
                      stage={stage}
                      isDragging={dragSnapshot.isDragging}
                      dragHandleSlot={
                        <span
                          {...dragProvided.dragHandleProps}
                          aria-label={`Move ${company.name} to another stage`}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <CardGrip />
                        </span>
                      }
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {provided.placeholder}

            {companies.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-900/10 py-8 text-center">
                <Inbox className="size-4 text-slate-300" aria-hidden />
                <p className="text-[11px] text-slate-400">Drop a client here</p>
              </div>
            ) : null}
          </div>
        )}
      </Droppable>
    </div>
  );
}
