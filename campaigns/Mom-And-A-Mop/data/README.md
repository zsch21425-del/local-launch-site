# Mom & A Mop — Performance Data Imports

> Labeled import plan. Every import answers a specific question.

## Available / connected
| Source | Status | What it answers |
|--------|--------|-----------------|
| Google Search Console | ❌ not confirmed | Queries, clicks, indexed pages |
| Bing Webmaster Tools | ✅ **VERIFIED + SUBMITTED (2026-08-11)** | Indexing, ChatGPT visibility |
| — mom-and-mop | ✅ verified via BingSiteAuth.xml + home URL submitted (single-page site) | |
| GA4 | ❌ not confirmed | Traffic, pages |
| Clarity / Hotjar | ❌ not confirmed | User behavior |
| Rank tracking / AI visibility | ❌ not connected | Rankings + AI citations |

## Imports to pull (when access provided)
1. GSC queries + pages (last 90 days) — label `data/gsc-queries-YYYY-MM-DD.csv` + date range header.
2. GSC indexing report.
3. Bing: submit site + sitemap once verified (see references/bing-webmaster-api.md).

## Labeling convention
Every data file: first line `# <Source> — <what it is> — <date range> — <what it answers>`.
