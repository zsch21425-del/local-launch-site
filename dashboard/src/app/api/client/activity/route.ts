import { NextResponse } from "next/server";
import { getCompany } from "@/lib/data";

export const dynamic = "force-dynamic";
const IS_SERVERLESS = !!process.env.VERCEL;

/** Build a per-client activity timeline from pipeline state + Obsidian vault files.
 * Derives events from: stage, playbook done-items, pitch lifecycle, lastContact/lastUpdated,
 * and any Client-Context.md / artifact files in the vault (parsed for dated lines). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") ?? "";
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });

  const company = getCompany(companyId);
  if (!company) return NextResponse.json({ error: `Unknown company: ${companyId}` }, { status: 404 });

  const events: any[] = [];
  const push = (ts: string | null, type: string, detail: string, actor?: string) => {
    events.push({ ts, type, detail, actor });
  };

  // 1. Pipeline state → derived events
  if (company.stage) push(company.lastUpdated ?? null, "stage", `Current stage: ${company.stage}`);
  if (company.lastContact) push(company.lastContact, "contact", "Last contact recorded");
  if (company.lastUpdated) push(company.lastUpdated, "sync", "Pipeline record updated");

  for (const item of company.playbook ?? []) {
    if (item.done && item.detail) {
      push(company.lastUpdated ?? null, "playbook", item.detail, "playbook");
    }
  }

  const pd = company.pitchDraft as any;
  if (pd?.status) {
    push(pd.reviewedAt ?? company.lastUpdated ?? null, "pitch", `Pitch status: ${pd.status}`);
    if (pd.reviewFeedback?.reason) {
      push(pd.reviewFeedback.reviewedAt ?? null, "pitch", `Pitch feedback: ${pd.reviewFeedback.reason}`);
    }
  }

  // 2. Obsidian vault files (local-only) — dynamically imported, never traced on Vercel
  let vaultFiles: { name: string; path: string }[] = [];
  if (!IS_SERVERLESS) {
    try {
      const { readClientActivity } = await import("@/lib/vault-reader");
      const res = await readClientActivity(companyId, company.name);
      vaultFiles = res.vaultFiles ?? [];
      if (vaultFiles.length > 0) {
        push(null, "vault", `${vaultFiles.length} work file(s) in vault`, "vault");
      }
    } catch {
      /* vault unavailable */
    }
  }

  events.sort((a, b) => {
    if (!a.ts && !b.ts) return 0;
    if (!a.ts) return 1;
    if (!b.ts) return -1;
    return b.ts.localeCompare(a.ts);
  });

  return NextResponse.json({ events, vaultFiles });
}
