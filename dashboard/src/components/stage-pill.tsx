import type { Stage } from "@/lib/data";
import { isInProgress, stageIcon, stageTheme } from "@/lib/stages";
import { cn } from "@/lib/utils";

/** Colored pill naming the pipeline stage a company currently sits in. */
export function StagePill({
  stage,
  size = "default",
  showIcon = true,
  className,
}: {
  stage: Stage;
  size?: "sm" | "default";
  showIcon?: boolean;
  className?: string;
}) {
  const theme = stageTheme(stage.color);
  const Icon = stageIcon(stage.icon);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        theme.pill,
        className,
      )}
    >
      {showIcon ? (
        <Icon
          className={cn(
            size === "sm" ? "size-3" : "size-3.5",
            isInProgress(stage.id) && "animate-stage-pulse",
          )}
          aria-hidden
        />
      ) : (
        <span
          className={cn(
            "size-1.5 rounded-full",
            theme.dot,
            isInProgress(stage.id) && "animate-stage-pulse",
          )}
          aria-hidden
        />
      )}
      {stage.label}
    </span>
  );
}
