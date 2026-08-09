import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PIPELINE_PATH = path.join(process.cwd(), "data", "pipeline.json");

/** POST: partial-update a company's pitchDraft.status */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, status } = body as {
      companyId: string;
      status: "approved" | "rejected" | "conditional";
    };

    if (!companyId || !status) {
      return NextResponse.json(
        { error: "Missing companyId or status" },
        { status: 400 },
      );
    }

    if (!["approved", "rejected", "conditional"].includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 },
      );
    }

    if (!fs.existsSync(PIPELINE_PATH)) {
      return NextResponse.json(
        { error: "Pipeline data not found" },
        { status: 404 },
      );
    }

    const raw = fs.readFileSync(PIPELINE_PATH, "utf-8");
    const data = JSON.parse(raw);

    const companies = data.companies;
    if (!Array.isArray(companies)) {
      return NextResponse.json(
        { error: "Invalid pipeline data" },
        { status: 500 },
      );
    }

    const company = companies.find((c: any) => c.id === companyId);
    if (!company) {
      return NextResponse.json(
        { error: `Company not found: ${companyId}` },
        { status: 404 },
      );
    }

    if (!company.pitchDraft) {
      return NextResponse.json(
        { error: `Company has no pitch draft: ${companyId}` },
        { status: 400 },
      );
    }

    // Only update pitchDraft.status — leave all other fields unchanged
    company.pitchDraft.status = status;

    fs.writeFileSync(PIPELINE_PATH, JSON.stringify(data, null, 2));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
