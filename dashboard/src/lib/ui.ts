/**
 * Shared card recipes — crisp borders and subtle shadows against the slate
 * background so every surface reads clearly.
 */

/** Standard content card: opaque white with dark border. */
export const glass =
  "rounded-2xl border border-slate-300 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08),0_16px_40px_-20px_rgba(15,23,42,0.16)]";

/** Lighter weight — used for kanban columns so cards stay the focal point. */
export const glassSubtle =
  "rounded-2xl border border-slate-200 bg-white/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

/** Draggable card: fully opaque with strong border. */
export const glassCard =
  "rounded-xl border border-slate-300 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-16px_rgba(15,23,42,0.24)]";

/** Sticky chrome (header). */
export const glassBar =
  "border-b border-slate-200 bg-white/90 backdrop-blur-xl";
