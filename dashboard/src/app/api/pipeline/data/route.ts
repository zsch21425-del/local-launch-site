import { NextResponse } from "next/server";
import { crmListCompaniesResult, type CrmCompany } from "@/lib/crm-client";
import { readPipelineState } from "@/lib/pipeline-store";

/**
 * GET /api/pipeline/data
 *
 * Phase 1: read from Vercel Blob (the live OS book). The bundled data/pipeline.json
 * is still used for the static page build, but at runtime this endpoint is the
 * single read path the UI uses to render company lists.
 *
 * Contract: { companies, stages, agency, crmCompanies, crmConnected }
 *   - Blob shape is { agency, pipeline:{stages}, companies, carLotsPipeline, revenue }
 *     but the live API has always been flat ({ stages } at top level). We unwrap
 *     pipeline.stages back to top level so the API contract doesn't change.
 *   - Missing/garbled Blob = 500 (never silently fall back to the bundled file —
 *     that would re-create the two-book problem Phase 1 exists to fix).
 *   - A VALID but empty book (`{ companies: [] }`, e.g. after the last lead was
 *     deleted) is NOT an error (M09): 200 with `companies: []` + `empty:true`
 *     so the UI shows a real zero state and "add the first lead" still works.
 */
export async function GET() {
  const state = await readPipelineState();
  if (!state.readable || !state.data) {
    return NextResponse.json(
      { error: "Pipeline store unreadable", companies: [], stages: [], agency: {}, crmCompanies: [], crmConnected: false },
      { status: 500 },
    );
  }
  const data = state.data;
  const companies = data.companies;
  const stages = data.pipeline?.stages ?? data.stages ?? [];
  const agency = data.agency ?? {};

  // Phase 1 integration: read live CRM companies as a mirror (best-effort).
  // pipeline.json remains the durable source of truth; a CRM outage never
  // breaks the dashboard. M10: `crmConnected` reflects an ACTUAL successful
  // response — a swallowed error/null no longer reads as "connected".
  let crmCompanies: CrmCompany[] = [];
  let crmConnected = false;
  let crmError: string | null = null;
  if (process.env.CRM_SESSION_TOKEN) {
    const r = await crmListCompaniesResult(500);
    if (r.ok) {
      crmCompanies = r.data;
      crmConnected = true;
    } else {
      crmError = r.error;
    }
  }

  return NextResponse.json({
    companies,
    stages,
    agency,
    empty: companies.length === 0,
    crmCompanies,
    crmConnected,
    ...(crmError ? { crmError } : {}),
  });
}
