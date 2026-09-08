/**
 * Pre-send email domain gate.
 * Catches dead domains (NXDOMAIN / no MX) before any pitch goes out.
 * Does NOT do SMTP RCPT (port 25 blocked on most hosts/Vercel) — MX/A is the hard stop.
 */

import dns from "node:dns/promises";

const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "comcast.net",
  "bellsouth.net",
  "att.net",
  "sbcglobal.net",
  "verizon.net",
  "charter.net",
  "cox.net",
  "protonmail.com",
  "proton.me",
  "pm.me",
]);

export type EmailGateStatus = "VALID" | "INVALID" | "UNKNOWN";

export type EmailGateResult = {
  status: EmailGateStatus;
  email: string;
  domain: string;
  reason: string;
  /**
   * true only when the domain passed every check we can run. An MX record does
   * NOT prove the recipient mailbox exists — this is a domain gate, not mailbox
   * verification.
   */
  ok: boolean;
};

function parseEmail(raw: string): { local: string; domain: string } | null {
  const email = (raw || "").trim().toLowerCase();
  const m = email.match(/^([^@\s]+)@([^@\s]+\.[^@\s]+)$/);
  if (!m) return null;
  return { local: m[1], domain: m[2] };
}

/**
 * MX lookup outcome.
 *  - "mx"        real, usable MX records present
 *  - "null-mx"   RFC 7505 null MX — the domain explicitly accepts no mail
 *  - "no-mx"     domain resolves but publishes no MX (implicit A/AAAA delivery
 *                is still *possible* per RFC 5321 §5.1 — absence is not proof)
 *  - "nxdomain"  the domain itself does not exist
 *  - "temporary" SERVFAIL / timeout / REFUSED / network error — retryable,
 *                NEVER proof of invalidity
 */
type MxLookup =
  | { kind: "mx" }
  | { kind: "null-mx" }
  | { kind: "no-mx" }
  | { kind: "nxdomain" }
  | { kind: "temporary"; detail: string };

/** DNS error codes that mean "ask again later", not "this domain is bad". */
const TEMP_DNS_CODES = new Set([
  "ESERVFAIL",
  "ETIMEOUT",
  "ETIMEDOUT",
  "EREFUSED",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "EAI_AGAIN",
  "EBADRESP",
]);

async function lookupMx(domain: string): Promise<MxLookup> {
  try {
    const mx = await dns.resolveMx(domain);
    if (!Array.isArray(mx) || mx.length === 0) return { kind: "no-mx" };
    // RFC 7505 "Null MX": a single MX with preference 0 and a "." exchange.
    if (
      mx.length === 1 &&
      (mx[0].exchange === "." || mx[0].exchange === "") &&
      (mx[0].priority === 0 || Number.isNaN(Number(mx[0].priority)))
    ) {
      return { kind: "null-mx" };
    }
    // Any placeholder "." exchanges are unroutable; if none remain, treat as null.
    const real = mx.filter((r) => r.exchange && r.exchange !== ".");
    if (real.length === 0) return { kind: "null-mx" };
    return { kind: "mx" };
  } catch (e: any) {
    const code = String(e?.code || "");
    const msg = String(e?.message || "");
    if (code === "ENOTFOUND" || /nxdomain|enotfound/i.test(msg)) {
      return { kind: "nxdomain" };
    }
    if (code === "ENODATA") return { kind: "no-mx" };
    if (TEMP_DNS_CODES.has(code)) {
      return { kind: "temporary", detail: code };
    }
    // Unrecognised failure — be conservative, treat as retryable not invalid.
    return { kind: "temporary", detail: code || msg || "DNS error" };
  }
}

async function hasA(domain: string): Promise<boolean> {
  try {
    const a = await dns.resolve4(domain);
    return Array.isArray(a) && a.length > 0;
  } catch {
    try {
      const aaaa = await dns.resolve6(domain);
      return Array.isArray(aaaa) && aaaa.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * Gate an address before send.
 * INVALID = proven undeliverable — never send (malformed, NXDOMAIN, null MX,
 *           or no MX *and* no A/AAAA). Absence of MX alone is NOT proof.
 * VALID   = domain checks passed (real MX, or free-mail). Does NOT prove the
 *           mailbox exists.
 * UNKNOWN = could not prove either way — temporary resolver failure, or an
 *           MX-less domain that might still accept mail via its A/AAAA record.
 *           Retryable; caller may allow with caution.
 */
export async function gateEmail(raw: string): Promise<EmailGateResult> {
  const parsed = parseEmail(raw);
  if (!parsed) {
    return {
      status: "INVALID",
      email: (raw || "").trim(),
      domain: "",
      reason: "malformed address",
      ok: false,
    };
  }
  const { domain } = parsed;
  const email = `${parsed.local}@${domain}`;

  if (FREE_MAIL.has(domain)) {
    return {
      status: "VALID",
      email,
      domain,
      reason: "free-mail provider — domain checks passed (mailbox not verified)",
      ok: true,
    };
  }

  const mx = await lookupMx(domain);

  if (mx.kind === "mx") {
    return {
      status: "VALID",
      email,
      domain,
      reason: "domain checks passed (MX present) — recipient mailbox not verified",
      ok: true,
    };
  }

  if (mx.kind === "null-mx") {
    return {
      status: "INVALID",
      email,
      domain,
      reason: "domain does not accept email (RFC 7505 null MX)",
      ok: false,
    };
  }

  if (mx.kind === "nxdomain") {
    return {
      status: "INVALID",
      email,
      domain,
      reason: "domain does not exist (NXDOMAIN — would bounce)",
      ok: false,
    };
  }

  if (mx.kind === "no-mx") {
    // No MX published. RFC 5321 §5.1 permits implicit delivery to the domain's
    // A/AAAA record, so a missing MX is NOT proof the address is dead.
    const a = await hasA(domain);
    if (a) {
      return {
        status: "UNKNOWN",
        email,
        domain,
        reason:
          "no MX record, but domain has an A/AAAA record — implicit mail delivery is possible but unverified",
        ok: false,
      };
    }
    return {
      status: "INVALID",
      email,
      domain,
      reason: "no MX and no A/AAAA record (nothing to deliver to — would bounce)",
      ok: false,
    };
  }

  // mx.kind === "temporary"
  return {
    status: "UNKNOWN",
    email,
    domain,
    reason: `temporary DNS resolver failure (${mx.detail}) — retryable, not proven invalid`,
    ok: false, // strict by default for dashboard gate
  };
}

/**
 * Pre-send pitch content gates (Astra audit #1, Zach-approved 2026-09-08).
 * Demo-live curl + dead-pricing + SC-law checks on the draft BEFORE approve.
 * Pure + sync (no network): demo-live is verified by the /api/pipeline/approve
 * route via HEAD request; these helpers judge already-fetched signals.
 */

export type ContentGateStatus = "PASS" | "FAIL";

export type ContentGateResult = {
  status: ContentGateStatus;
  reason: string;
  ok: boolean;
};

const DEAD_PRICING = [
  /\$300\b/,
  /\$49\b/,
  /\$90\b/,
  /launch\s*\(\s*\$300/i,
  /grow\s*\(\s*\$400/i,
  /dominate\s*\(\s*\$500/i,
];

const SC_CALL_CTA = [
  /call or text (me|us)/i,
  /call me/i,
  /text me/i,
  /give me a call/i,
  /call\/text/i,
];

/** Two-letter state code parsed from location ("Greenville, SC" -> "SC"). */
export function stateCode(location?: string | null): string | null {
  const m = (location || "").match(/,\s*([A-Z]{2})\b/);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Gate dead pricing in a draft body: $300 / $49/mo / $90 / Launch-Grow-Dominate.
 * FAIL = draft quotes retired pricing — must be rewritten at $599/$149.
 */
export function gateDeadPricing(body?: string | null): ContentGateResult {
  const text = body || "";
  const hit = DEAD_PRICING.find((re) => re.test(text));
  if (hit) {
    return {
      status: "FAIL",
      reason: `draft quotes retired pricing (matched ${hit}) — rewrite at $599 build / $149 mo Care`,
      ok: false,
    };
  }
  return { status: "PASS", reason: "no retired pricing in draft", ok: true };
}

/**
 * Gate SC call/text CTAs in a draft body: SC law bars agent calls/texts —
 * SC leads are email-only. FAIL = body tells an SC prospect to call/text.
 */
export function gateScLaw(
  body?: string | null,
  location?: string | null,
): ContentGateResult {
  if (stateCode(location) !== "SC") {
    return { status: "PASS", reason: "not an SC lead — call CTA allowed", ok: true };
  }
  const text = body || "";
  const hit = SC_CALL_CTA.find((re) => re.test(text));
  if (hit) {
    return {
      status: "FAIL",
      reason: `SC lead with call/text CTA (matched ${hit}) — SC is email-only, remove the call ask`,
      ok: false,
    };
  }
  return { status: "PASS", reason: "SC lead, no call/text CTA", ok: true };
}

/** Pick best email on a company record (top-level, then pitchDraft.email). */
export function companyEmailCandidate(company: {
  email?: string | null;
  pitchDraft?: { email?: string | null } | null;
}): string | null {
  const top = (company.email || "").trim();
  if (top) return top;
  const pe = (company.pitchDraft?.email || "").trim();
  return pe || null;
}
