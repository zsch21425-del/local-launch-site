# Local Launch — Monthly Report Generator

The retention engine for T2 ($35/mo) and T3 ($50/mo) clients: every month, one command
produces a branded "here's what moved" PDF.

## Monthly workflow (per client, ~5 minutes)

```bash
cd /mnt/d/LocalLaunch/reporting

python3 monthly_report.py redwood \
  --set reviews=31 --set rating=4.9 --set gbp_calls=12 --set leads=5 \
  --note "Published 'retaining wall cost' blog post" \
  --note "Answered 4 new reviews on Google" \
  --focus "Launch review-request SMS campaign"
```

Output: `reports/redwood/Local-Launch-Report-2026-07.pdf` — email it to the client.

## What's automatic vs. manual

**Automatic** (site re-scan every run): title/meta/H1, schema types, HTTPS, mobile
viewport, FAQ markup, word count, image alt coverage, sitemap/robots, load time →
scored on the same 100-point SEO rubric as the sales audits, plus a GEO signals score.

**Manual** (`--set key=value`, from GBP dashboard — 2 min to look up): reviews, rating,
gbp_views, gbp_calls, gbp_directions, leads, citations, share_of_ai_voice. Skip any you
don't have; the section only shows what you provide.

## How month-over-month works

Every run saves `snapshots/<slug>/YYYY-MM.json`. The next run diffs against the most
recent earlier snapshot and renders ▲/▼ deltas. **Run it once at client onboarding** to
set the baseline — that first report doubles as the "before" for the case study.

## Adding a client

Copy `clients/redwood.json`, change name/url/tier/next_focus. Slug = filename.

## Flags

`--month YYYY-MM` backfill/override · `--html-file page.html` offline scoring ·
`--no-pdf` HTML only (skip WeasyPrint)

## Notes

- Not deployed to Vercel — this folder is internal tooling. `vercel_deploy.py` walks the
  whole project dir, so **add `reporting` to `EXCLUDE_DIRS`** to keep client data off the
  public site (see Hermes handoff).
- Deps: `requests`, `weasyprint` (both already on the WSL box).
