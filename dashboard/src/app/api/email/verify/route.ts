import { NextRequest, NextResponse } from "next/server";
import { gateEmail } from "@/lib/email-gate";
import { readPipelineSafe } from "@/lib/pipeline-store";
import { isObject, badField, strMax, optional } from "@/lib/validate";

/**
 * GET /api/email/verify?email=a@b.com
 * GET /api/email/verify?companyId=foo
 * POST { email } or { companyId }
 *
 * Returns { status: VALID|INVALID|UNKNOWN, ok, reason, email, domain }
 * Auth via middleware cookie.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const emailParam = sp.get("email");
  const companyId = sp.get("companyId");

  let email = emailParam?.trim() || "";
  if (!email && companyId) {
    const data: any = await readPipelineSafe();
    const c = (data.companies || []).find(
      (x: any) => String(x.id).toLowerCase() === companyId.toLowerCase(),
    );
    if (!c) {
      return NextResponse.json({ error: "company not found" }, { status: 404 });
    }
    email = (c.email || c.pitchDraft?.email || "").trim();
  }
  if (!email) {
    return NextResponse.json(
      { error: "email or companyId required" },
      { status: 400 },
    );
  }

  const result = await gateEmail(email);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // M06: `null` / primitive body would throw on `body.email` access → 500.
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object", field: "body" },
      { status: 400 },
    );
  }
  const bad = badField(body, {
    email: (v) => optional(v, (x) => strMax(x, 320)),
    companyId: (v) => optional(v, (x) => strMax(x, 320)),
  });
  if (bad) {
    return NextResponse.json(
      { error: `Invalid or missing field: ${bad}`, field: bad },
      { status: 400 },
    );
  }

  let email = String(body.email || "").trim();
  if (!email && body.companyId) {
    const data: any = await readPipelineSafe();
    const c = (data.companies || []).find(
      (x: any) =>
        String(x.id).toLowerCase() === String(body.companyId).toLowerCase(),
    );
    if (!c) {
      return NextResponse.json({ error: "company not found" }, { status: 404 });
    }
    email = (c.email || c.pitchDraft?.email || "").trim();
  }
  if (!email) {
    return NextResponse.json(
      { error: "email or companyId required" },
      { status: 400 },
    );
  }
  const result = await gateEmail(email);
  return NextResponse.json(result);
}
