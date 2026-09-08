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

/* ---------------------------------------------------------------- SSRF --- */

const MAX_BODY_BYTES = 512 * 1024; // enough for <head>/<title>, caps a hostile body
const MAX_REDIRECTS = 4;

/** Loopback / private / link-local / metadata hosts — must never be fetched
 *  server-side (SSRF). Covers IPv4 ranges, IPv6 loopback/ULA/link-local, and
 *  the common cloud metadata / *.internal / *.local names. */
function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/\.$/, "");
  if (!h) return true;
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "metadata" || h === "metadata.google.internal") return true;

  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const o = v4.slice(1, 5).map((n) => Number(n));
    if (o.some((n) => n > 255)) return true;
    const [a, b] = o;
    if (a === 0 || a === 127 || a === 10) return true; // this-host, loopback, private
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true; // 192.168/16
    if (a === 169 && b === 254) return true; // link-local + 169.254.169.254 metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  if (h.includes(":")) {
    // IPv6 literal
    if (h === "::1" || h === "::") return true; // loopback / unspecified
    if (h.startsWith("fe80:") || h.startsWith("fe80::")) return true; // link-local
    if (/^f[cd][0-9a-f]{2}:/.test(h)) return true; // fc00::/7 unique-local
    if (h.startsWith("::ffff:")) return true; // IPv4-mapped
    return false;
  }

  return false;
}

/** Policy gate for an editable demo URL before any server-side fetch. */
function validateAuditUrl(
  raw: string,
): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "unparseable URL" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: `blocked scheme (${url.protocol || "none"}; https only)` };
  }
  if (isBlockedHost(url.hostname)) {
    return { ok: false, reason: `blocked host (${url.hostname})` };
  }
  return { ok: true, url };
}

/** Read a response body, hard-capped at `max` bytes (defends against a
 *  hostile server streaming gigabytes). */
async function readCappedText(res: Response, max: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < max) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.length;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* already closed */
    }
  }
  const buf = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    buf.set(c.subarray(0, Math.min(c.length, buf.length - off)), off);
    off += c.length;
    if (off >= buf.length) break;
  }
  return new TextDecoder().decode(buf).slice(0, max);
}

/** Fetch with redirects followed MANUALLY so every hop is re-validated against
 *  the SSRF policy. Returns null when a hop is blocked / not fetchable. */
async function safeFetch(
  start: URL,
  signal: AbortSignal,
): Promise<{ status: number; text: string } | null> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,*/*",
      },
    });
    const loc = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && loc) {
      let next: URL;
      try {
        next = new URL(loc, current);
      } catch {
        return null;
      }
      const v = validateAuditUrl(next.toString());
      if (!v.ok) return null;
      current = v.url;
      continue;
    }
    const text = res.status < 400 ? await readCappedText(res, MAX_BODY_BYTES) : "";
    return { status: res.status, text };
  }
  return null; // redirect loop / too many hops
}

interface AuditEntry {
  companyId: string;
  name: string;
  url: string;
  httpStatus: number | null;
  title: string;
  status: "ok" | "404" | "wrong-business" | "error";
  /** Set when the URL was rejected by policy or was otherwise not fetchable. */
  note?: string;
}

async function auditOne(company: any): Promise<AuditEntry> {
  const url = resolveDemoUrl(company);
  const base = {
    companyId: company.id,
    name: company.name,
    url: url || "",
  };
  if (!url) {
    return { ...base, httpStatus: null, title: "", status: "error", note: "no demo URL" };
  }
  const gate = validateAuditUrl(url);
  if (!gate.ok) {
    // Clean "not fetchable" result — never a 500, never a server-side fetch.
    return { ...base, httpStatus: null, title: "", status: "error", note: gate.reason };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const r = await safeFetch(gate.url, controller.signal);
    if (!r) {
      return {
        ...base,
        httpStatus: null,
        title: "",
        status: "error",
        note: "not fetchable (blocked redirect / too many hops)",
      };
    }
    const httpStatus = r.status;
    const title = httpStatus < 400 ? extractTitle(r.text) : "";
    if (httpStatus === 404) {
      return { ...base, httpStatus, title, status: "404" };
    }
    if (httpStatus >= 400) {
      return { ...base, httpStatus, title, status: "error" };
    }
    const status = titleMatchesName(title, company.name) ? "ok" : "wrong-business";
    return { ...base, httpStatus, title, status };
  } catch {
    return { ...base, httpStatus: null, title: "", status: "error", note: "fetch failed" };
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
