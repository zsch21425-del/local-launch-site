import { NextResponse } from "next/server";
import { getCompanies, getStages, getAgency } from "@/lib/data";
import { crmListCompanies } from "@/lib/crm-client";

export async function GET() {
  const companies = getCompanies();
  const stages = getStages();
  const agency = getAgency();

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
