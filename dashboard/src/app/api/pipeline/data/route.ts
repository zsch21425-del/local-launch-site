import { NextResponse } from "next/server";
import { crmListCompanies } from "@/lib/crm-client";
import { readPipelineSafe } from "@/lib/pipeline-store";

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
 *   - Empty/invalid Blob = 500 (never silently fall back to the bundled file —
 *     that would re-create the two-book problem Phase 1 exists to fix).
 */
export async function GET() {
  const data = await readPipelineSafe();
  const companies = Array.isArray(data?.companies) ? data.companies : [];
  if (companies.length === 0) {
    return NextResponse.json(
      { error: "Pipeline store empty or unreadable", companies: [], stages: [], agency: {}, crmCompanies: [], crmConnected: false },
      { status: 500 },
    );
  }
  const stages = data.pipeline?.stages ?? data.stages ?? [];
  const agency = data.agency ?? {};

  // Phase 1 integration: read live CRM companies as a mirror (best-effort).
  // pipeline.json remains the durable source of truth; a CRM outage never
  // breaks the dashboard (crmListCompanies returns [] on any failure).
  let crmCompanies: Awaited<ReturnType<typeof crmListCompanies>> = [];
  let crmConnected = false;
  if (process.env.CRM_SESSION_TOKEN) {
    try {
      crmCompanies = await crmListCompanies(50);
      crmConnected = true;
    } catch {
      crmCompanies = [];
      crmConnected = false;
    }
  }

  return NextResponse.json({ companies, stages, agency, crmCompanies, crmConnected });
}
