import { TrendingUp } from "lucide-react";

import { scoreTheme } from "@/lib/stages";
import { glass } from "@/lib/ui";
import { cn } from "@/lib/utils";

/**
 * G-SCORE gauge — a 270° SVG arc with a colour ramp from critical (rose) to
 * strong (emerald), plus the milestone ticks a client actually cares about.
 */
export function SeoGauge({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 100;
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));
  const theme = scoreTheme(percent);

  const size = 190;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  /** 270° of the circle is the gauge; the remaining 90° is the open bottom. */
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength * (1 - percent / 100);

  return (
    <section className={cn(glass, "flex flex-col p-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {label}
        </h2>
        <span
          className={cn(
            "rounded-full bg-card/70 px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-border",
            theme.text,
          )}
        >
          {theme.label}
        </span>
      </div>

      <div className="relative mx-auto mt-4" style={{ width: size, height: size * 0.82 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-135"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            className="text-muted-foreground/60"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pb-6">
          <span className="tnum text-5xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          <span className="tnum text-xs font-medium text-muted-foreground">
            out of {safeMax}
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-start gap-2 rounded-lg bg-foreground/[0.03] p-3 text-xs leading-relaxed text-muted-foreground">
        <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span>
          Generative-engine visibility score. Schema markup, GBP completeness and
          entity grounding move this number fastest.
        </span>
      </div>
    </section>
  );
}
