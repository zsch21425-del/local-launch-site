# Local Launch OS — Build Spec v1

## Goal
Build a full "operating system" dashboard for Local Launch agency. This is a premium web application where Zach can manage every client, run agent tasks, and see the entire business at a glance.

## Pages

### 1. HOME `/` — Command Center
**Sections stacked vertically:**

- **Hero** — Local Launch branding, today's date, quick stats pill (8 clients, 2 won, $X MRR)
- **Stats bar** — 6 clickable stat cards (already built, reuse existing StatsBar)
- **Pipeline Kanban** — 6 columns with draggable client cards (already built, reuse)
- **Revenue** — MRR + one-time tracker (already built)
- **Today's tasks** — open playbook items across all clients (already built)
- **Quick nav sidebar** (left, collapsible) — Pipeline | Leads | Clients | Reports | Settings
- **Activity feed** — recent agent actions (last 10 messages/updates)

### 2. CLIENT PROFILE `/client/[slug]` — THE MAIN PAGE
This is where the magic happens. Clicking any client card opens their full profile.

**Layout: Split screen**
- **LEFT (60%)** — Client workspace
- **RIGHT (40%)** — Agent chat panel

**LEFT PANEL SECTIONS (stacked):**
1. **Header** — Client name, category badge, priority badge, stage pill, back button
2. **Stage progress** — visual tracker showing which stages complete
3. **SEO gauge** — circular gauge showing G-SCORE with breakdown
4. **Contact card** — phone, email, website, Facebook, address, last contact date
5. **Company summary** — what they do, key info, prospect score
6. **Playbook checklist** — GROUPED BY STAGE. Each item has checkbox + expandable description. Checked items show green. Completed stages show collapsed. Current stage is highlighted.
7. **Next steps** — numbered actionable list
8. **Activity log** — timestamps of what's been done for this client (pulled from vault)

**RIGHT PANEL — Agent Chat:**
- Header: "Local Launch Agent" with green online dot
- Message area: conversation between Zach and the agent about THIS client
- Input bar at bottom: type a message, hit send
- Messages appear as bubbles (user right-aligned, agent left-aligned with green accent)
- Agent responses include spinner while waiting
- Each message contextually tied to the current client (agent knows which client you're viewing)

**How chat works (V1):**
- Front-end: POST to `/api/agent/chat` with `{ clientId, message }`
- API route: calls a local relay endpoint to reach Hermes agent
- Response: agent replies with context about this specific client
- Pending: polling for async responses (V2)

### 3. LEADS `/leads` — Prospect Management
- Table/grid of all prospected companies
- Columns: Name, Category, Phone, Priority, Prospect Score, Days Since Added
- Click → opens client profile at /client/[slug]
- "Add lead" button → modal form
- Filter by priority, category, date added

### 4. REPORTS `/reports` — Analytics Dashboard
- Revenue chart (projected MRR growth)
- Pipeline funnel (Prospected → Contacted → Audited → Built → Live → Won)
- Playbook completion rate across all clients
- SEO score averages
- Client acquisition timeline

## Data Flow
All data comes from `/data/pipeline.json` (static import). The agent chat stores messages temporarily in React state (will be backed by a real store in V2).

## Agent Chat API Route
Create `/src/app/api/agent/chat/route.ts`:
- Accepts POST with `{ clientId: string, message: string }`
- In V1: returns a simulated response saying "Agent is processing..." with client context
- In V2: relays to actual Hermes agent via local relay endpoint

## Component Architecture

```
New components to build:
  client-header.tsx       — name, badges, stage pill
  client-contact.tsx      — phone, email, website, etc.
  client-summary.tsx      — description, needs
  client-timeline.tsx     — activity log
  agent-chat.tsx          — chat panel with message bubbles
  agent-message.tsx       — individual message bubble
  agent-input.tsx         — chat input bar
  sidebar-nav.tsx         — left navigation
  leads-table.tsx         — leads grid
  pipeline-funnel.tsx     — funnel chart
  revenue-chart.tsx       — MRR chart

Existing (reuse):
  motion-background.tsx   — animated background
  stats-bar.tsx           — stat cards
  pipeline-kanban.tsx     — kanban board
  stage-column.tsx        — kanban column
  company-card.tsx        — client card
  seo-gauge.tsx           — SEO score gauge
  playbook-checklist.tsx  — grouped checklists
  stage-tracker.tsx       — progress bar
  priority-badge.tsx      — priority indicator
  stage-pill.tsx          — stage pill
  revenue-tracker.tsx     — revenue display
  todays-tasks.tsx        — open tasks list
```

## Design Rules (CRITICAL)
- **Gray slate background** (#F1F5F9) with animated particle canvas
- **White cards** with slate-300 borders (reuse glass/glassCard from lib/ui.ts)
- **No black, no dark mode** — light theme only
- **Inter/Geist font**
- **lucide-react icons only** — zero emojis
- **Mobile responsive** — sidebar collapses, panels stack
- **All cards must have visible borders** (slate-300)

## Build Order
1. Build sidebar-nav.tsx
2. Update layout.tsx with sidebar
3. Build client-header.tsx
4. Build client-contact.tsx  
5. Build client-summary.tsx
6. Build agent-chat.tsx + agent-message.tsx + agent-input.tsx
7. Build client profile page `/client/[slug]/page.tsx`
8. Build leads page `/leads/page.tsx`
9. Build reports page `/reports/page.tsx`
10. Build API route `/api/agent/chat/route.ts`
11. Run `npm run build` — FIX ALL ERRORS before reporting done

## Success Criteria
- ✅ `npm run build` passes with zero errors
- ✅ Home page renders with all existing sections + new sidebar
- ✅ Clicking any client card opens /client/[slug] with full profile
- ✅ Agent chat panel visible on right side of client profile
- ✅ Leads page shows all prospected clients
- ✅ Reports page shows funnel + revenue charts
- ✅ Mobile: sidebar becomes hamburger menu, panels stack vertically
