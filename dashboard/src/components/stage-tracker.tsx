import { Check } from "lucide-react";

import type { Stage, StageId } from "@/lib/data";
import { getStageIndex } from "@/lib/data";
import { stageIcon, stageTheme } from "@/lib/stages";
import { cn } from "@/lib/utils";

interface StageTrackerProps {
  stages: Stage[];
  current: StageId;
}

export function StageTracker({ stages, current }: StageTrackerProps) {
  const currentIndex = getStageIndex(current);

  return (
    <ol className="flex items-start gap-1 overflow-x-auto pb-1">
      {stages.map((stage, index) => {
        const isDone = currentIndex > index;
        const isCurrent = currentIndex === index;
        const theme = stageTheme(stage.color);
        const Icon = stageIcon(stage.icon);

        return (
          <li
            key={stage.id}
            className="flex min-w-[84px] flex-1 flex-col items-center gap-2"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex w-full items-center gap-1">
              <Connector filled={index > 0 && (isDone || isCurrent)} hidden={index === 0} />
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isDone && cn(theme.dot, "border-transparent text-slate-950"),
                  isCurrent &&
                    cn(
                      "border-transparent ring-4",
                      theme.pill,
                      "ring-current/10",
                    ),
                  !isDone && !isCurrent && "border-border text-muted-foreground/60",
                )}
              >
                {isDone ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>
              <Connector
                filled={isDone}
                hidden={index === stages.length - 1}
              />
            </div>
            <span
              className={cn(
                "text-center text-[11px] leading-tight font-medium",
                isCurrent ? theme.text : "text-muted-foreground",
              )}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Connector({ filled, hidden }: { filled: boolean; hidden: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "h-0.5 flex-1 rounded-full",
        hidden ? "opacity-0" : filled ? "bg-primary/50" : "bg-border",
      )}
    />
  );
}
