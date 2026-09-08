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
  compact = false,
  emptyHint,
  badgeCount,
}: {
  stage: Stage;
  companies: Company[];
  /** Slim drop-target column when board is focused on another stage */
  compact?: boolean;
  emptyHint?: string;
  /** When compact+empty, show true stage size in header */
  badgeCount?: number;
}) {
  const theme = stageTheme(stage.color);
  const Icon = stageIcon(stage.icon);
  const count = badgeCount ?? companies.length;

  return (
    <div
      className={cn(
        glassSubtle,
        "flex h-full w-full flex-col",
        compact && "min-h-[12rem]",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3.5 pt-3.5 pb-3",
          compact && "flex-col items-start gap-1 px-2.5 pt-2.5 pb-2",
        )}
      >
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
          <h3
            className={cn(
              "truncate text-[13px] font-semibold tracking-tight text-foreground",
              compact && "text-[11px] leading-tight whitespace-normal",
            )}
          >
            {compact ? `→ ${stage.label}` : stage.label}
          </h3>
        </div>
        <span
          className={cn(
            "tnum grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
            theme.pill,
          )}
        >
          {count}
        </span>
      </div>

      {!compact ? (
        <div className="px-3.5">
          <div className={cn("h-1 w-full rounded-full", theme.bar)} aria-hidden />
        </div>
      ) : null}

      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex min-h-[8rem] flex-1 flex-col gap-2.5 rounded-b-2xl p-3 transition-colors duration-200",
              compact && "min-h-[10rem] p-2",
              snapshot.isDraggingOver && "bg-primary/[0.12]",
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
              <div
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-foreground/10 text-center",
                  compact ? "px-1 py-6" : "py-8",
                )}
              >
                <Inbox className="size-4 text-muted-foreground/60" aria-hidden />
                <p className="text-[11px] leading-snug text-muted-foreground">
                  {emptyHint || "Drop a client here"}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </Droppable>
    </div>
  );
}
