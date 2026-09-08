/**
 * Shared card recipes — crisp, visible borders and a real layered-elevation
 * shadow system so white surfaces stand OUT from the warm background with
 * genuine 3D depth, not a flat outline.
 *
 * Depth recipe: a tight contact shadow + a mid "lift" shadow + a wide diffuse
 * ambient shadow (negative spread pulls it in for a soft elevated cast).
 */

/** Standard content card: opaque white, visible border, layered elevation. */
export const glass =
  "rounded-2xl border border-slate-300/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_10px_-2px_rgba(15,23,42,0.10),0_18px_40px_-16px_rgba(15,23,42,0.18)]";

/** Lighter weight — used for kanban columns so cards stay the focal point. */
export const glassSubtle =
  "rounded-2xl border border-slate-200/90 bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

/** Draggable card: fully opaque, stronger elevation, gentle hover lift. */
export const glassCard =
  "hover-lift rounded-xl border border-slate-300 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08),0_4px_10px_-2px_rgba(15,23,42,0.12),0_20px_40px_-16px_rgba(15,23,42,0.20)] hover:shadow-[0_2px_4px_rgba(15,23,42,0.10),0_8px_18px_-4px_rgba(15,23,42,0.16),0_28px_56px_-18px_rgba(15,23,42,0.26)]";

/** Sticky chrome (header). */
export const glassBar =
  "border-b border-slate-300/70 bg-white/90 backdrop-blur-md";

/** Inner card nested inside a `glass` panel — flat-but-lifted, for status tiles and list rows. */
export const innerCard =
  "rounded-lg border border-slate-300/70 bg-slate-50 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_3px_6px_-2px_rgba(15,23,42,0.08)]";

/** Interactive inner-card variant — adds the same gentle hover lift as `glassCard`. */
export const innerCardInteractive =
  "hover-lift rounded-lg border border-slate-300/70 bg-slate-50 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_3px_6px_-2px_rgba(15,23,42,0.08)] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_20px_-6px_rgba(15,23,42,0.16)]";
