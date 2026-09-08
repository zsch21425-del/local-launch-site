/**
 * CRM client — bridges the LL OS dashboard to Comp AI CRM (tRPC API).
 *
 * Auth: better-auth signed session cookie. The token is minted in the CRM's
 * Neon DB (see /opt/crm-svc-cred.env on the droplet) and signed with
 * BETTER_AUTH_SECRET (better-call format: token.signature, HMAC-SHA256,
 * base64, then encodeURIComponent). Cookie name: __Secure-crm.session_token
 * (secure prefix because APP_URL is https).
 *
 * Env vars (server-side only, never client):
 *   CRM_ENDPOINT / CRM_API_URL   CRM base URL — MUST be https:// (or an explicit
 *                                loopback host for local dev). Plaintext http on
 *                                a public host is refused and every call is
 *                                skipped (fail closed) — see src/lib/relay-config.ts.
 *   CRM_SESSION_TOKEN    raw session token from /opt/crm-svc-cred.env
 *   CRM_BETTER_AUTH_SECRET  BETTER_AUTH_SECRET from the CRM .env
 */
import { createHmac } from "crypto";
import { getCrmBaseUrl } from "./relay-config";

const TOKEN = process.env.CRM_SESSION_TOKEN || "";
const SECRET = process.env.CRM_BETTER_AUTH_SECRET || "";
const COOKIE_NAME = "__Secure-crm.session_token";

function signCookie(): string {
  if (!TOKEN || !SECRET) return "";
  const sig = createHmac("sha256", SECRET).update(TOKEN).digest("base64");
  return encodeURIComponent(`${TOKEN}.${sig}`);
}

/**
 * Typed result for every CRM call (M10). `ok:false` carries WHY — a swallowed
 * `null` used to be indistinguishable from "the CRM answered with no data",
 * which made callers report a dead CRM as connected.
 */
export type CrmResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** tRPC query (GET) — typed result. */
export async function crmQueryResult<T>(
  path: string,
  input: unknown,
): Promise<CrmResult<T>> {
  const base = getCrmBaseUrl();
  if (!base) return { ok: false, error: "CRM endpoint unset or insecure (HTTPS required)" };
  const cookie = signCookie();
  if (!cookie) return { ok: false, error: "CRM credentials incomplete (token/secret missing)" };
  try {
    const url = `${base}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
    const res = await fetch(url, {
      headers: { Cookie: `${COOKIE_NAME}=${cookie}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `CRM HTTP ${res.status} on ${path}` };
    const body = await res.json();
    return { ok: true, data: (body?.result?.data ?? null) as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || `CRM unreachable on ${path}` };
  }
}

/** tRPC mutation (POST) — typed result.
 * NOTE: mutations take the raw input object (no {json:} wrapper) — verified. */
export async function crmMutationResult<T>(
  path: string,
  input: unknown,
): Promise<CrmResult<T>> {
  const base = getCrmBaseUrl();
  if (!base) return { ok: false, error: "CRM endpoint unset or insecure (HTTPS required)" };
  const cookie = signCookie();
  if (!cookie) return { ok: false, error: "CRM credentials incomplete (token/secret missing)" };
  try {
    const url = `${base}/api/trpc/${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${COOKIE_NAME}=${cookie}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: `CRM HTTP ${res.status} on ${path}` };
    const body = await res.json();
    return { ok: true, data: (body?.result?.data ?? null) as T };
  } catch (e: any) {
    return { ok: false, error: e?.message || `CRM unreachable on ${path}` };
  }
}

/** tRPC query (GET) — returns parsed result.data, or null on any failure.
 * Back-compat wrapper; prefer crmQueryResult for new code. */
export async function crmQuery<T>(path: string, input: unknown): Promise<T | null> {
  const r = await crmQueryResult<T>(path, input);
  return r.ok ? r.data : null;
}

/** tRPC mutation (POST) — returns parsed result.data, or null on any failure.
 * Back-compat wrapper; prefer crmMutationResult for new code. */
export async function crmMutation<T>(path: string, input: unknown): Promise<T | null> {
  const r = await crmMutationResult<T>(path, input);
  return r.ok ? r.data : null;
}

export interface CrmCompany {
  id: string;
  name: string;
  domain?: string | null;
  website?: string | null;
  description?: string | null;
  industry?: string | null;
  city?: string | null;
  stateCode?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface CrmListResult {
  rows: CrmCompany[];
  total: number;
}

/** List companies from the CRM — typed result (M10). Pages through the full set
 * (bounded) so an upsert lookup can't miss a match past the first page. */
export async function crmListCompaniesResult(
  limit = 500,
): Promise<CrmResult<CrmCompany[]>> {
  const pageSize = Math.min(Math.max(limit, 1), 500);
  const rows: CrmCompany[] = [];
  const MAX_PAGES = 40; // hard cap: 40 * 500 = 20k companies
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await crmQueryResult<CrmListResult>("companies.list", { page, pageSize });
    if (!r.ok) return r;
    const batch = r.data?.rows ?? [];
    rows.push(...batch);
    if (rows.length >= limit) return { ok: true, data: rows.slice(0, limit) };
    if (batch.length < pageSize) break; // last page
  }
  return { ok: true, data: rows };
}

/** List companies from the CRM (limit/take). Returns [] on any failure —
 * back-compat wrapper; prefer crmListCompaniesResult so callers can tell a
 * genuine empty CRM from an outage. */
export async function crmListCompanies(limit = 500): Promise<CrmCompany[]> {
  const r = await crmListCompaniesResult(limit);
  return r.ok ? r.data : [];
}

/**
 * Upsert a company into the CRM. Looks up by name (companies.list has no
 * search-by-name in the minimal contract, so we list and match), then creates
 * or updates. Returns the CRM company id, or null on failure.
 *
 * M10: a FAILED lookup aborts (returns null) instead of falling through to a
 * blind create (which produced duplicates). An update that fails no longer
 * reports the stale existing id as success. create/update now send every
 * supplied field, not just name+domain.
 */
export async function crmUpsertCompany(input: {
  name: string;
  domain?: string;
  description?: string;
  industry?: string;
  city?: string;
  stateCode?: string;
  phone?: string;
  email?: string;
}): Promise<string | null> {
  const r = await crmUpsertCompanyResult(input);
  return r.ok ? r.data : null;
}

/** Typed variant of crmUpsertCompany — carries the failure reason (M10). */
export async function crmUpsertCompanyResult(input: {
  name: string;
  domain?: string;
  description?: string;
  industry?: string;
  city?: string;
  stateCode?: string;
  phone?: string;
  email?: string;
}): Promise<CrmResult<string>> {
  const profile = {
    domain: input.domain,
    website: input.domain ? `https://${input.domain}` : undefined,
    description: input.description,
    industry: input.industry,
    city: input.city,
    stateCode: input.stateCode,
    phone: input.phone,
    email: input.email,
  };

  // Lookup — a failure here must NOT be treated as "not found".
  const list = await crmListCompaniesResult(500);
  if (!list.ok) return { ok: false, error: `lookup failed: ${list.error}` };
  const match = list.data.find(
    (c) => (c.name ?? "").toLowerCase() === input.name.toLowerCase(),
  );

  if (match) {
    const res = await crmMutationResult<{ id: string }>("companies.update", {
      id: match.id,
      data: profile,
    });
    if (!res.ok) return { ok: false, error: `update failed: ${res.error}` };
    return { ok: true, data: res.data?.id ?? match.id };
  }

  const res = await crmMutationResult<{ id: string }>("companies.create", {
    name: input.name,
    ...profile,
  });
  if (!res.ok) return { ok: false, error: `create failed: ${res.error}` };
  if (!res.data?.id) return { ok: false, error: "create returned no id (not persisted)" };
  return { ok: true, data: res.data.id };
}
