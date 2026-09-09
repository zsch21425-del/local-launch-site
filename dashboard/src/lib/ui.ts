/**
 * Shared card recipes — dark elevated surfaces with hairline borders and soft
 * elevation, matching the premium SaaS aesthetic (subtle lift + faint accent
 * glow on hover, no heavy black drop shadows).
 */

/** Standard content card: opaque dark slate, hairline border, soft elevation. */
export const glass =
  "rounded-2xl border border-slate-700/60 bg-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_8px_24px_-12px_rgba(0,0,0,0.45)]";

/** Lighter weight — used for kanban columns so cards stay the focal point. */
export const glassSubtle =
  "rounded-2xl border border-slate-700/60 bg-slate-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.25)]";

/** Draggable card: fully opaque, hairline border, soft lift + violet glow on hover. */
export const glassCard =
  "hover-lift rounded-xl border border-slate-700/70 bg-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.35),0_8px_20px_-10px_rgba(0,0,0,0.5)] hover:border-violet-500/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_8px_24px_-8px_rgba(0,0,0,0.55),0_0_24px_-6px_rgba(139,92,246,0.35)]";

/** Sticky chrome (header). */
export const glassBar =
  "border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md";

/** Inner card nested inside a `glass` panel — flat-but-lifted. */
export const innerCard =
  "rounded-lg border border-slate-700/60 bg-slate-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.25)]";

/** Interactive inner-card variant — gentle hover lift + violet glow. */
export const innerCardInteractive =
  "hover-lift rounded-lg border border-slate-700/60 bg-slate-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.25)] hover:border-violet-500/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_0_20px_-6px_rgba(139,92,246,0.3)]";
