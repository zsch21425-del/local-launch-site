# Visual Polish Pass — Hallmark Redesign (2026-09-08)

Wire the OKLCH token system in `src/app/globals.css` through the component layer so
the dashboard reads as the branded Local Launch product (deep evergreen primary,
warm off-white base) instead of a generic slate/emerald dashboard.

**Scope:** visual layer only. No routes, logic, data flow, props, signatures, or
copy changed. Source edits + build verification only. Nothing deployed. Live Blob /
production data untouched.

---

## 1. `src/app/globals.css`

Kept intact: `@import` directives, the full `@theme inline` block, the mesh-drift /
micro-anim keyframes, `.hover-lift`, `.kanban-scroll`, reduced-motion block.

Added to `:root`:

| Token | Value | Purpose |
|---|---|---|
| `--surface` | `oklch(0.995 0.002 95)` | elevated card surface, brighter/warmer than `--background` |
| `--shadow-card` | `0 1px 2px … / 0 4px 12px -4px …` (cool-grey) | resting card elevation |
| `--shadow-card-hover` | `0 2px 4px … / 0 8px 24px -6px …` | hover card elevation |
| `--ring-strong` | `oklch(0.53 0.115 165)` (reuses primary) | keyboard-focus ring |

Existing `--ring` left as-is.

`@theme inline`: added `--color-surface: var(--surface)` so `bg-surface` /
`border-surface` / `text-surface` utilities generate.

`@layer base`: added a floor `:focus-visible { outline: 2px solid var(--ring-strong);
outline-offset: 2px; border-radius: var(--radius-sm); }` — every interactive element
now gets a consistent evergreen focus ring; components that declare their own
`focus-visible:ring-*` utilities still layer on top.

---

## 2. Token wiring — component + page layer

Applied the task mapping mechanically across **39 component/page files** (`src/components/**`,
`src/app/**/page.tsx`; `src/app/api/*` excluded). Every hardcoded
`slate-* / emerald-* / rose-* / green-*` palette class is gone (`grep` verified clean).

| From | To |
|---|---|
| `text-slate-950/900/800/700` | `text-foreground` |
| `text-slate-600/500/400` | `text-muted-foreground` |
| `text-slate-300/200` (+opacity) | `text-muted-foreground/60` |
| `bg-white` (+ `/85` `/90` …) | `bg-card` (opacity preserved) |
| `bg-slate-50/100/200/300` (+opacity) | `bg-muted` |
| `bg-slate-400/500` (+opacity) | `bg-muted-foreground` |
| `bg-slate-700/800/900` (+opacity) | `bg-foreground` (scrims, dark chat bubbles) |
| `border-slate-100/200/300` | `border-border` |
| `border-slate-900` (+opacity) | `border-foreground` |
| `divide-slate-*`, `ring-slate-*`, `outline-slate-*` | `divide-border` / `ring-border` / `outline-border` |
| `border-white` / `ring-white` / `divide-white` (+opacity) | `border-card` / `ring-card` / `divide-card` |
| `text-emerald-* / text-green-*` | `text-primary` |
| `bg-emerald-50/100`, `bg-green-50/100` (tints, any opacity) | `bg-primary/10` (normalised) |
| `bg-emerald-* / bg-green-*` (solid, +opacity) | `bg-primary` (opacity preserved) |
| `border-emerald-* / border-green-*` | `border-primary` |
| `ring-emerald-* / ring-green-*` | `ring-ring` |
| `from-/to-/via-emerald|green-*` | `…-primary` |
| `text-rose-*` | `text-destructive` |
| `bg-rose-50/100` (tints) | `bg-destructive/10` |
| `bg-rose-*` (solid, +opacity) | `bg-destructive` |
| `border-rose-* / ring-rose-* / from-|to-rose-*` | `…-destructive` |
| `accent-emerald-600` | `accent-primary` |
| `placeholder-slate-400` (legacy syntax) | `placeholder:text-muted-foreground` |

### Polish applied during the pass

- **Solid-fill buttons** (`bg-emerald-600 hover:bg-emerald-700`,
  `bg-rose-600 hover:bg-rose-700`, `bg-slate-900 hover:bg-slate-800`) collapsed to
  `bg-primary` / `bg-destructive` / `bg-foreground` — the hover step was rewritten to
  `hover:bg-{token}/90` so the darker-on-press affordance survives instead of
  becoming a no-op.
- **Refresh-link buttons** in `client-assets`, `client-timeline`, `app-chrome` had
  `text-slate-400 hover:text-slate-600` (darken on hover). That would have flattened
  to a no-op, so hover was set to `hover:text-foreground` (+ `transition-colors`).
- **Active nav item** now renders `bg-primary/10 text-primary` (evergreen quiet
  style) via the mapping — the brand colour is finally visible in the rail.
- **Primary CTAs / active chips / kanban drag-over** now use `bg-primary` /
  `bg-primary/[0.12]` — evergreen, not emerald-500.
- **Badge counts** (sidebar approval/demo pills) → `bg-destructive` /
  `bg-destructive/10 text-destructive`.
- Headings already used `font-semibold tracking-tight`; left as roman (no italic
  anywhere). Stat numbers keep `.tnum`.

### Files touched (40)

`globals.css` + these `.tsx`:

```
app/approvals/page.tsx      app/automation/page.tsx     app/clients/page.tsx
app/demos/page.tsx          app/fleet/page.tsx          app/leads/page.tsx
app/login/page.tsx          app/page.tsx                app/reports/page.tsx
components/add-lead-dialog   components/agent-chat       components/agent-input
components/agent-message     components/app-chrome       components/car-lots-section
components/client-approval-panel   components/client-assets   components/client-build-demo
components/client-contact    components/client-header    components/client-summary
components/client-timeline   components/client-workstation   components/cold-call-sheet
components/company-card      components/global-search    components/leads-table
components/pipeline-kanban   components/progress-ring    components/quick-dispatch
components/revenue-tracker   components/seo-gauge        components/sidebar-nav
components/stage-column      components/stage-tracker    components/stats-bar
components/todays-tasks      components/ui/dialog        components/work-inbox
```

`git diff --stat`: **40 files changed, 516 insertions(+), 492 deletions(-)**.

---

## 3. Verification

| Command | Result |
|---|---|
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | **exit 0** |
| `npm run build` | **exit 0** — `✓ Compiled successfully`, 27/27 static pages |

---

## 4. Deliberately left with non-token palette classes

### `src/lib/ui.ts` — NOT edited (out of scope)

The constraint "Do NOT touch `src/lib/*` … only components + pages + globals.css"
was followed. `ui.ts` holds the shared card recipes — `glass`, `glassSubtle`,
`glassCard`, `glassBar`, `innerCard`, `innerCardInteractive` — which still contain
`border-slate-200/*`, `bg-white`, `bg-white/70`, `bg-slate-50` and arbitrary rgba
shadow stacks.

Visual impact is minimal: `bg-white` is identical to `--card` (both pure white),
and `slate-200` (~`oklch(0.929)`) is within a hair of `--border` (`oklch(0.91 0.004 85)`).
The token wiring in the component layer (text, primary, destructive, muted,
backgrounds, borders on non-recipe elements) carries the redesign.

**Follow-up (needs a task that permits `src/lib/`):** port the six recipes to
`rounded-xl border border-border bg-card shadow-[var(--shadow-card)]` /
`bg-surface` for elevated cards, and swap the hover shadow stacks for
`shadow-[var(--shadow-card-hover)]`. That's the last ~10% of the polish and the
only reason any `slate`/`white` string remains in the dashboard.

### Retained semantic signal colours (intentional, ~125 occurrences / 15 files)

Outside the task's slate/emerald/rose/white brand-palette scope. These encode
state, not brand, and there are no tokens for them:

| Colour | Meaning | Example files |
|---|---|---|
| `amber-*` (≈50) | warnings, "build demo", pending/attention states | `client-build-demo`, `approvals/page`, `client-approval-panel`, `client-workstation` |
| `violet-*` (≈32) | the "rework" approval state (distinct from reject) | `client-approval-panel`, `work-inbox`, `approvals/page` |
| `sky-*` (≈23) | informational / CRM / "in review" | `client-build-demo`, `work-inbox`, `client-approval-panel` |
| `red-*` (≈20) | hard error detail (separate from `rose`→`destructive`) | `agent-chat`, `demos/page`, `fleet/page` |

If a future pass wants these tokenised, add `--warning` / `--info` / `--rework`
(or similar) to `:root` + `@theme inline` first, then map.

---

## 5. Not done / explicitly out of scope

- No deploy, no worker scripts, no Blob writes, no production data mutation.
- `src/lib/*`, `src/app/api/*`, `scripts/*`, `data/pipeline.json` untouched.
- No copy, metric, route, prop, or behaviour changes. No fake browser chrome,
  no invented numbers, no italic headings.
