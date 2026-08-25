# Local Launch Dashboard — V2 Build Spec

## 🎯 Goal
Rebuild the Local Launch client pipeline dashboard as a premium, beautiful, operational tool for a Greenville SC web design & SEO agency. The current version is ugly (black background, basic cards). This rebuild should look like a $10,000 SaaS product.

## 🎨 Design Requirements

### Overall
- **NO BLACK BACKGROUNDS.** Light/neutral base (white, off-white, warm gray). 
- **Motion background** — subtle animated canvas or CSS effect behind the content. Must NOT interfere with readability of buttons, text, or cards. Pick one from shadcn.io/background — prefer "mesh gradient", "aurora", or soft "particles" effect.
- **Glassmorphism cards** — semi-transparent cards with backdrop-blur to let the background show through while keeping content readable.
- **Modern typography** — use Inter or Geist font. Clean hierarchy.
- **Professional color palette** — warm, inviting. No harsh colors. Green/SLATE as primary, warm accents.

### Motion Background (CRITICAL)
Pick an animated background from https://shadcn.io/background that:
- Is subtle and won't compete with UI elements
- Works on mobile
- Has light-mode variants
- Options: mesh gradient, animated gradient, aurora, soft wave

The background should sit BEHIND all content. Cards should use `backdrop-blur-xl bg-white/70` (glassmorphism) so the motion background shows through translucent cards.

## 📊 Pages

### Page 1: Home Dashboard
- **Hero section** — "Local Launch" branding with tagline, phone number, stats bar (total clients, active, won, revenue)
- **Pipeline Kanban** — 6 columns for each pipeline stage. Cards are draggable between stages. Each card shows: company name, category, priority badge, playbook progress (e.g., "1/11"), last activity date.
- **Revenue tracker** — if a company is in "Won" stage, show MRR/one-time revenue. Sum total.
- **Quick actions** — "Add new lead" button, "Today's tasks" sidebar

### Page 2: Company Detail
- Link from each card → `/company/[slug]`
- **Back button** to home
- **Stage progress bar** — visual tracker of which stages are complete
- **SEO Gauge** — circular gauge showing G-SCORE (0-100) with visual feedback
- **Playbook checklist** — grouped by stage, each item has checkbox, expandable description
- **Contact card** — phone, website, Facebook, email, notes
- **Summary card** — client description, needs, next steps
- **Quick actions** — "Move to next stage", "Add note", "Call client"

### Page 3: Anderson Car Lots Pipeline (same style, separate section)
- Table/grid view of 8 competitor BHPH lots in Anderson
- Each row: dealer name, website, schema status, priority

## 🧩 Component Architecture

All components must be in `/src/components/` directory:

```
components/
  motion-background.tsx    # Animated background from shadcn.io/background
  pipeline-kanban.tsx      # Kanban board with draggable cards
  stage-column.tsx         # Individual kanban column
  company-card.tsx         # Glass card in kanban
  stage-pill.tsx           # Colored pill for pipeline stage
  priority-badge.tsx       # High/Medium/Low badge
  progress-ring.tsx        # Circular progress indicator
  seo-gauge.tsx            # G-SCORE gauge
  playbook-checklist.tsx   # Grouped checklist
  stats-bar.tsx            # Stats overview
  revenue-tracker.tsx      # Revenue summary
  contact-card.tsx         # Contact info card
  header.tsx               # Site header with navigation
```

## 📁 Data

Data comes from `/data/pipeline.json`. Structure:
```json
{
  "agency": { "name", "tagline", "phone", "website", "email" },
  "pipeline": {
    "stages": [{ "id", "label", "icon", "color" }]
  },
  "companies": [{
    "id", "name", "category", "stage", "priority", "city", "state",
    "playbookSteps", "playbookCompleted", "date", "website", "phone",
    "seoScore", "seoLabel", "summary", "contactNotes", "companyInfo",
    "playbook": { "audited": [...], "website-built": [...], "live": [...] }
  }],
  "carLots": [{
    "name", "website", "schema", "priority", "notes"
  }],
  "revenue": { "mrr", "oneTime", "clientCount" }
}
```

## 🛠️ Tech Stack
- **Next.js 15** (App Router) — already scaffolded
- **TypeScript** — strict mode
- **Tailwind CSS** — with glassmorphism utilities
- **shadcn/ui** components (Button, Card, Badge, Progress, Dialog, Tabs)
- **@hello-pangea/dnd** — drag and drop for kanban
- **Recharts** — for any charts
- **Animated background** — from shadcn.io/background (copy-paste module, zero deps)
- **Geist font** — from next/font/google

## 🚫 DO NOT
- Do NOT use black or dark backgrounds anywhere
- Do NOT use emojis as icons (use lucide-react or SVG)
- Do NOT make the motion background overwhelming — subtle only
- Do NOT create placeholder/skeleton components — build real ones
- Do NOT use `<img>` tags for icons — always use lucide-react or inline SVG

## 🎯 Success Criteria
- Glassmorphism cards with backdrop-blur showing motion background behind
- Kanban board with drag-and-drop between stages
- Beautiful typography and spacing
- Works on mobile (responsive)
- Company detail page with playbook checklist and SEO gauge
- All data coming from pipeline.json (static import)

## 🚀 Order of Operations
1. Install dependencies (shadcn/ui components, @hello-pangea/dnd)
2. Build motion-background.tsx first — test it renders
3. Build the home page with kanban
4. Build the company detail page
5. Polish spacing, colors, typography
6. Verify with `npm run build`

## 📝 Before you finish
- Run `npm run build` — must pass with zero errors
- All pages must render without crashes
- Mobile responsive check
