import { NextResponse } from "next/server";
import { getCompany } from "@/lib/data";

export const dynamic = "force-dynamic";
const IS_SERVERLESS = !!process.env.VERCEL;

/** GET /api/client/file?companyId=X&file=Y — serve a client vault work file (local-only). */
export async function GET(request: Request) {
  if (IS_SERVERLESS) {
    return NextResponse.json({ error: "local-only" }, { status: 503 });
  }
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") ?? "";
  const file = url.searchParams.get("file") ?? "";
  if (!companyId || !file) return NextResponse.json({ error: "companyId and file required" }, { status: 400 });

  const company = getCompany(companyId);
  if (!company) return NextResponse.json({ error: "Unknown company" }, { status: 404 });

  // vault-reader is dynamically imported only on local (non-serverless) runs,
  // so Turbopack never traces fs usage into the serverless bundle.
  const { readClientFile } = await import("@/lib/vault-reader");
  const res = await readClientFile(companyId, company.name, file);
  if (res.error === "File not found") return NextResponse.json({ error: "File not found" }, { status: 404 });
  if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
  return new NextResponse(res.content ?? "", {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
