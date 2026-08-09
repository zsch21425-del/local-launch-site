import { formatPriority, priorityTheme } from "@/lib/stages";
import { cn } from "@/lib/utils";

/** High / Medium-High / Medium / Low badge. */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  const theme = priorityTheme(priority);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        theme.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", theme.dot)} aria-hidden />
      {formatPriority(priority)}
    </span>
  );
}
