/**
 * Shared card recipes — dark surfaces with crisp borders and a layered
 * elevation shadow system so cards read as distinct raised tiles on the
 * near-black canvas.
 *
 * Depth recipe: a tight contact shadow + a mid "lift" shadow + a wide diffuse
 * ambient shadow (negative spread pulls it in for a soft elevated cast).
 * Shadows are pure black so they read against the dark background.
 */

/** Standard content card: opaque dark slate, visible border, layered elevation. */
export const glass =
  "rounded-2xl border border-slate-700/60 bg-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_4px_10px_-2px_rgba(0,0,0,0.3),0_18px_40px_-16px_rgba(0,0,0,0.5)]";

/** Lighter weight — used for kanban columns so cards stay the focal point. */
export const glassSubtle =
  "rounded-2xl border border-slate-700/60 bg-slate-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.3)]";

/** Draggable card: fully opaque, stronger elevation, gentle hover lift. */
export const glassCard =
  "hover-lift rounded-xl border border-slate-700 bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.5),0_4px_10px_-2px_rgba(0,0,0,0.4),0_20px_40px_-16px_rgba(0,0,0,0.6)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.5),0_8px_18px_-4px_rgba(0,0,0,0.5),0_28px_56px_-18px_rgba(0,0,0,0.7)]";

/** Sticky chrome (header). */
export const glassBar =
  "border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md";

/** Inner card nested inside a `glass` panel — flat-but-lifted, for status tiles and list rows. */
export const innerCard =
  "rounded-lg border border-slate-700/60 bg-slate-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_3px_6px_-2px_rgba(0,0,0,0.3)]";

/** Interactive inner-card variant — adds the same gentle hover lift as `glassCard`. */
export const innerCardInteractive =
  "hover-lift rounded-lg border border-slate-700/60 bg-slate-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.3),0_3px_6px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_8px_20px_-6px_rgba(0,0,0,0.5)]";
