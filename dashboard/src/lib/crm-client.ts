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
 *   CRM_API_URL          e.g. http://137.184.135.50:3001
 *   CRM_SESSION_TOKEN    raw session token from /opt/crm-svc-cred.env
 *   CRM_BETTER_AUTH_SECRET  BETTER_AUTH_SECRET from the CRM .env
 */
import { createHmac } from "crypto";

const API_URL = process.env.CRM_API_URL || "http://137.184.135.50:3001";
const TOKEN = process.env.CRM_SESSION_TOKEN || "";
const SECRET = process.env.CRM_BETTER_AUTH_SECRET || "";
const COOKIE_NAME = "__Secure-crm.session_token";

function signCookie(): string {
  if (!TOKEN || !SECRET) return "";
  const sig = createHmac("sha256", SECRET).update(TOKEN).digest("base64");
  return encodeURIComponent(`${TOKEN}.${sig}`);
}

/** tRPC query (GET) — returns parsed result.data */
export async function crmQuery<T>(path: string, input: unknown): Promise<T | null> {
  const cookie = signCookie();
  if (!cookie) return null;
  try {
    const url = `${API_URL}/api/trpc/${path}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
    const res = await fetch(url, {
      headers: { Cookie: `${COOKIE_NAME}=${cookie}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.result?.data ?? null;
  } catch {
    return null; // CRM unreachable — callers fall back to pipeline.json
  }
}

/** tRPC mutation (POST) — fire-and-forget friendly; returns parsed result.data
 * NOTE: mutations take the raw input object (no {json:} wrapper) — verified. */
export async function crmMutation<T>(path: string, input: unknown): Promise<T | null> {
  const cookie = signCookie();
  if (!cookie) return null;
  try {
    const url = `${API_URL}/api/trpc/${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${COOKIE_NAME}=${cookie}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.result?.data ?? null;
  } catch {
    return null;
  }
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

/** List companies from the CRM (limit/take). */
export async function crmListCompanies(limit = 500): Promise<CrmCompany[]> {
  const data = await crmQuery<CrmListResult>("companies.list", { page: 1, pageSize: limit });
  return data?.rows ?? [];
}

/** Upsert a company into the CRM. Looks up by name first (companies.list has
 * no search-by-name in the minimal contract, so we list and match), then
 * creates or updates. Returns the CRM company id or null on failure. */
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
  try {
    // Try to find an existing company with this name (limit 200 to cover the pipeline)
    const existing = await crmListCompanies(200);
    const match = existing.find(
      (c) => c.name.toLowerCase() === input.name.toLowerCase(),
    );

    if (match) {
      // Update the existing company's profile fields
      const res = await crmMutation<{ id: string }>("companies.update", {
        id: match.id,
        data: {
          domain: input.domain,
          website: input.domain ? `https://${input.domain}` : undefined,
          description: input.description,
          industry: input.industry,
          city: input.city,
          stateCode: input.stateCode,
          phone: input.phone,
          email: input.email,
        },
      });
      return res?.id ?? match.id;
    }

    // Create a new company
    const res = await crmMutation<{ id: string }>("companies.create", {
      name: input.name,
      domain: input.domain,
    });
    return res?.id ?? null;
  } catch {
    return null; // best-effort mirror; dashboard state is authoritative
  }
}
