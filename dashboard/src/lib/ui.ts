/**
 * Shared card recipes — crisp, warm borders and a soft elevation system so
 * surfaces read as layered content, not glassmorphism. Kept token-free here
 * (Tailwind utilities) but tuned to the warm off-white base in globals.css.
 */

/** Standard content card: opaque white with a hairline warm border. */
export const glass =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]";

/** Lighter weight — used for kanban columns so cards stay the focal point. */
export const glassSubtle =
  "rounded-2xl border border-slate-200/60 bg-white/70 shadow-[0_1px_2px_rgba(15,23,42,0.03)]";

/** Draggable card: fully opaque with a slightly stronger elevation. */
export const glassCard =
  "rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-12px_rgba(15,23,42,0.16)]";

/** Sticky chrome (header). */
export const glassBar =
  "border-b border-slate-200/70 bg-white/85 backdrop-blur-md";
