import { NextResponse } from "next/server";
import { readPipelineSafe } from "@/lib/pipeline-store";

/** Demo URL resolution — mirrors src/lib/data.ts resolveDemoUrl (inline to avoid
 *  pulling the bundled pipeline.json snapshot into this route). */
function resolveDemoUrl(c: any): string | null {
  const explicit = c?.demo?.url ?? c?.demoUrl ?? null;
  if (!explicit || typeof explicit !== "string") return null;
  const url = explicit.trim();
  return url.length ? url : null;
}

function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Heuristic "does this page title belong to this company" — catches the
 *  wrong-business case (e.g. B&M serving FIX Home Projects) without flagging
 *  benign title decorations ("B&M Pressure Washing — Fountain Inn, SC"). */
function titleMatchesName(title: string, name: string): boolean {
  const t = normalize(title);
  const n = normalize(name);
  if (!n || !t) return true; // cannot judge → don't flag
  const core = n
    .replace(
      /\b(llc|inc|incorporated|company|co|corp|corporation|llp|lp|service|services|group|of|the|and|a|an)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (t.includes(core)) return true;
  const firstTwo = core.split(" ").filter((w) => w.length > 2).slice(0, 2).join(" ");
  return firstTwo.length > 3 && t.includes(firstTwo);
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

interface AuditEntry {
  companyId: string;
  name: string;
  url: string;
  httpStatus: number | null;
  title: string;
  status: "ok" | "404" | "wrong-business" | "error";
}

async function auditOne(company: any): Promise<AuditEntry> {
  const url = resolveDemoUrl(company);
  const base = {
    companyId: company.id,
    name: company.name,
    url: url || "",
  };
  if (!url) {
    return { ...base, httpStatus: null, title: "", status: "error" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,*/*",
      },
    });
    const httpStatus = res.status;
    const title = res.ok ? extractTitle(await res.text()) : "";
    if (httpStatus === 404) {
      return { ...base, httpStatus, title, status: "404" };
    }
    if (httpStatus >= 400) {
      return { ...base, httpStatus, title, status: "error" };
    }
    const status = titleMatchesName(title, company.name) ? "ok" : "wrong-business";
    return { ...base, httpStatus, title, status };
  } catch {
    return { ...base, httpStatus: null, title: "", status: "error" };
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

/** GET /api/demos/audit — pre-send gate: curl every demo URL, flag 404 / wrong-business.
 *  Auth is enforced by middleware (ACCESS_CODE cookie / Bearer). */
export async function GET() {
  const data = await readPipelineSafe();
  const companies: any[] = Array.isArray(data?.companies) ? data.companies : [];
  if (companies.length === 0) {
    return NextResponse.json(
      { error: "Pipeline store empty or unreadable", audited: [], summary: {} },
      { status: 500 },
    );
  }

  const withDemos = companies.filter((c) => resolveDemoUrl(c));
  const audited = await mapLimit(withDemos, 8, auditOne);

  const summary = {
    total: audited.length,
    ok: audited.filter((a) => a.status === "ok").length,
    broken404: audited.filter((a) => a.status === "404").length,
    wrongBusiness: audited.filter((a) => a.status === "wrong-business").length,
    errored: audited.filter((a) => a.status === "error").length,
  };

  return NextResponse.json({ audited, summary, fetchedAt: new Date().toISOString() });
}
