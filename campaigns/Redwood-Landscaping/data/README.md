# Redwood Landscaping — Performance Data Imports

> Every import here is LABELED with source, date range, and what it answers. Unlabeled imports are noise.

## Available / connected
| Source | Status | What it answers |
|--------|--------|-----------------|
| Google Search Console | ✅ Connected (siteOwner verified Aug 7, 2026) | Queries, clicks, impressions, indexed pages |
| Bing Webmaster Tools | ✅ **VERIFIED + SUBMITTED (2026-08-11)** | Indexing, ChatGPT visibility |
| — Redwood site | ✅ verified via BingSiteAuth.xml + 12 URLs submitted | |
| GA4 | ❌ not confirmed | Traffic, pages, behavior |
| Microsoft Clarity / Hotjar | ❌ not confirmed | User behavior, scroll, heatmaps |
| Rank tracking / AI visibility | ❌ not connected | Rankings + AI citations over time |

## Imports to pull (when client/Zach provides access)
1. **GSC queries + pages** — export last 90 days. Label: `data/gsc-queries-YYYY-MM-DD.csv` + header noting date range.
2. **GSC indexing report** — which pages are indexed (canonical redwoodlandscapingsc.com).
3. **Bing submission** — submit sitemap `redwoodlandscapingsc.com/sitemap.xml` to Bing Webmaster Tools. THIS IS THE #1 ACTION.

## Manual evidence already captured
- geo-audit-2026-07-29.md (in /mnt/d/Redwood/website/) — full GEO/AI citation audit, cited in campaign-strategy.md.
- Bing `site:redwood-site-jade.vercel.app` = 0 results (2026-07-29) — proves the indexing gap.

## Labeling convention
Every data file: first line `# <Source> — <what it is> — <date range> — <what it answers>`.
