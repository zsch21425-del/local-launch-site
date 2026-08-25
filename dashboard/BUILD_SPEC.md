# Local Launch Dashboard — Build Spec

## What We're Building

A client pipeline dashboard for Local Launch (web design agency, Greenville SC). Company cards on the home page. Click a card → detail page with everything we know about that client: stage tracking, interactive playbook checklists, next steps, summaries, SEO scores.

**Data source:** `/data/pipeline.json` — I maintain this. The app reads it at build time.

## Pages

### Home Page (`/`)
- Header: "Local Launch 🚀" with tagline
- Pipeline stage filter tabs (Prospected / Contacted / Audited / Website Built / Live / Won)
- Company cards in a grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Each card shows: company name, category badge, location, current stage (color-coded pill), priority indicator, last updated
- Click card → navigates to `/company/[id]`
- Empty state when no companies match filter

### Company Detail Page (`/company/[id]`)
- Back button to home
- Company header: name, category, location, phone, website link, priority badge
- **Stage tracker:** horizontal step indicator showing all pipeline stages, current stage highlighted, completed stages checked
- **Summary card:** 2-3 sentence overview of the company
- **Playbook section:** Interactive checklist grouped by stage. Each item has:
  - Checkbox (checked = done)
  - Label
  - Stage indicator pill
  - Expandable detail text
  - Progress bar showing done/total
- **Next Steps card:** Bullet list of immediate actions
- **SEO Score card:** If available, show G-SCORE with visual gauge (0-100)
- **Contact card:** Phone, email, website, social links

### Anderson Car Lots Section (on home page or `/car-lots`)
- Market intel summary
- Competitor table with schema status indicators

## Tech Stack
- Next.js 15 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (install what you need: Card, Badge, Button, Progress, Checkbox, Tabs, Separator)
- Lucide React icons
- Static site (data from JSON, no API routes needed — I update the JSON)
- All data in `/data/pipeline.json`

## Design
- Dark theme (slate/gray backgrounds)
- Color-coded stages (slate, blue, amber, violet, emerald, green)
- Cards with subtle hover effects (border glow or slight lift)
- Clean typography — Inter or system font stack
- Mobile-first responsive
- Professional but modern

## Key UX Details
- Stage pills on cards should pulse subtly for "in progress" stages
- Playbook progress bar shows real completion %
- Empty playbook = "No steps yet" message
- Company card click should feel satisfying (hover scale + shadow)
- Detail page should feel comprehensive but scannable

## Files to Create/Modify

### `src/app/layout.tsx`
- Import Inter font
- Dark theme wrapper
- Simple nav/header

### `src/app/page.tsx`
- Home page with company cards
- Stage filter tabs
- Reads from pipeline.json

### `src/app/company/[id]/page.tsx`
- Company detail page
- Stage tracker, playbook, summaries

### `src/lib/data.ts`
- Type definitions
- Data loading from pipeline.json
- Helper functions

### `src/components/`
- `company-card.tsx`
- `stage-tracker.tsx`
- `playbook-checklist.tsx`
- `seo-gauge.tsx`
- `stage-filter.tsx`

### `data/pipeline.json`
- Already exists. Read it, don't modify it.

## Output
Build all files. Make sure `npm run build` passes. No API routes needed — this is a static site that reads pipeline.json at build time. I'll handle data updates.
