/**
 * Shared card recipes — crisp, warm borders and a soft elevation system so
 * surfaces read as layered content, not glassmorphism. Kept token-free here
 * (Tailwind utilities) but tuned to the warm off-white base in globals.css.
 */

/**
 * Every opaque surface gets an inset top-light hairline
 * (`inset_0_1px_0_rgba(255,255,255,0.8)`) on top of its drop shadow — that's
 * what gives the "carved" edge instead of a flat outline.
 */

/** Standard content card: opaque white with a crisp, layered elevation. */
export const glass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.05),0_2px_6px_-2px_rgba(15,23,42,0.06),0_16px_40px_-20px_rgba(15,23,42,0.18)]";

/** Lighter weight — used for kanban columns so cards stay the focal point. */
export const glassSubtle =
  "rounded-2xl border border-slate-200/60 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.03)]";

/** Draggable card: fully opaque, stronger elevation, gentle hover lift. */
export const glassCard =
  "hover-lift rounded-xl border border-slate-200/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_-14px_rgba(15,23,42,0.2)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(15,23,42,0.05),0_18px_34px_-16px_rgba(15,23,42,0.28)]";

/** Sticky chrome (header). */
export const glassBar =
  "border-b border-slate-200/70 bg-white/85 backdrop-blur-md";

/** Inner card nested inside a `glass` panel — flat-but-lifted, for status tiles and list rows. */
export const innerCard =
  "rounded-lg border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.05)]";

/** Interactive inner-card variant — adds the same gentle hover lift as `glassCard`. */
export const innerCardInteractive =
  "hover-lift rounded-lg border border-slate-200/90 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.05)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.05),0_12px_26px_-14px_rgba(15,23,42,0.2)]";
