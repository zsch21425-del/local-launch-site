/hallmark build a premium prospect pipeline dashboard for a local SEO agency called Local Launch. Single self-contained file: /mnt/d/LocalLaunch/prospect-dashboard/dashboard.html (vanilla HTML/CSS/JS, no build step, no external CDN dependencies that break offline — inline everything).

CONTEXT: This is an internal sales-pipeline tool. Zach (agency owner) tracks local-business prospects (plumbers, landscapers, auto dealers in Greenville SC) through stages: Audited → Demo Built → Outreach Drafted → Contacted → Site Demo → Proposal → Paid Client, plus On Hold / Re-Audit / Re-Pitch / Lost. He wants a visual ranking: top prospects (call-ready, demos built) at the top, and a clear read on what stage everything is in.

DATA: On page load, fetch('/api/prospects') -> {prospects: [{name, phone, city, vertical, stage, score, demo, offer, notes}]}. If fetch fails (file:// or server down), fall back to a small embedded sample of 3 prospects so the page never looks broken. Stage values are the keys: audited, demo_built, outreach_drafted, contacted, demo_shown, proposal, paid, on_hold, re_audit, re_pitch, lost.

FUNCTIONALITY (must all work):
1. HEADER: "Local Launch — Prospect Pipeline" with a live stat strip: total prospects, paid clients, demos built, outreach drafted, estimated pipeline value (count paid*350 + proposal*350 + demo_shown*350 + contacted*300 + outreach_drafted*300 as one-time build value, show as $X,XXX).
2. PIPELINE VIEW: horizontal stage columns (kanban) — each column shows stage label + count, cards inside. Cards show name, vertical chip, city, phone, demo link (if present, clickable "Demo →"), and a compact score badge. Drag-and-drop a card between columns to change stage (native HTML5 drag, no library).
3. RANKED LIST VIEW (toggle between Pipeline / Ranked): table sorted by priority — paid first, then proposal, demo_shown, contacted, outreach_drafted, demo_built, audited, then on_hold/re_audit/re_pitch/lost at the bottom; within stage sort by score ascending (lower score = bigger need = higher priority). Columns: Rank, Business, Vertical, City, Phone, Stage (dropdown to change), Demo, Notes.
4. EDIT: clicking a card or row opens an inline editor (modal or expanding panel — your choice) to edit name/phone/city/vertical/score/offer/notes and change stage. Every change immediately POSTs the full prospects array to /api/prospects (fetch POST, JSON body {prospects: [...]}), and shows a tiny "Saved ✓" toast. Debounce edits, not drags.
5. SEARCH: header search box filters cards/tables live by name/vertical/city. Filter chips for verticals (All, Plumbing, Landscaping, HVAC, Auto, Cleaning, Pest, Outdoor, Other).
6. ADD PROSPECT: "+ Add" button creates a blank card in Audited stage.
7. RESPONSIVE: desktop-first (it's a working dashboard), but collapses kanban to single-column scroll on <900px.

DESIGN (Hallmark rules — this is a working dashboard, keep it calm and premium, NOT a marketing page):
- Dark theme: deep charcoal/near-black background (#0d1117 family), soft elevated cards, subtle borders (rgba white 6-8%), generous spacing.
- ONE accent color used sparingly: teal #2AA8A8 (Local Launch brand). Stage colors should be muted/desaturated (avoid rainbow): use a restrained palette — e.g. audited=slate, demo_built=amber muted, outreach_drafted=sky muted, contacted=teal, demo_shown=violet muted, proposal=indigo muted, paid=green muted, hold/review states=gray/red muted.
- Typography: a strong display font for the header (system font stack with a distinctive pairing is fine — e.g. "Söhne"/Inter-classic is banned; use something with character like Fraunces or Space Grotesk via a <link> to Google Fonts, but ensure graceful fallback offline) and a clean sans for UI.
- NO purple-gradient hero, NO centered-everything, NO generic icon cards. No SVG logos. Small details: stage-column header has a subtle dot of its stage color; cards have a thin left border in stage color; drag ghost is a soft glow. Row hover shows a subtle lift.
- Add a tasteful empty state ("No prospects match") and a subtle footer: "Local Launch · Internal Pipeline".

VERIFY at the end: python3 -m py_compile is not applicable to html, but do open the file and confirm it contains fetch('/api/prospects'), drag-and-drop handlers, and the POST save logic. Print the file size and confirm it's written.
