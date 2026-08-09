import { cn } from "@/lib/utils";

/**
 * Circular progress indicator. Pure SVG — no chart library, no client JS.
 * Used for playbook completion on the kanban cards.
 */
export function ProgressRing({
  value,
  max,
  size = 36,
  strokeWidth = 3.5,
  trackClassName = "text-slate-200",
  indicatorClassName = "text-emerald-500",
  label,
  className,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  trackClassName?: string;
  indicatorClassName?: string;
  /** Text rendered inside the ring. Omit for a bare ring. */
  label?: string;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} of ${max} complete`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            "transition-[stroke-dashoffset] duration-700 ease-out",
            indicatorClassName,
          )}
          stroke="currentColor"
        />
      </svg>
      {label ? (
        <span className="tnum absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-700">
          {label}
        </span>
      ) : null}
    </div>
  );
}
