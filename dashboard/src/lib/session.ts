/**
 * HMAC-signed, expiring session tokens for the dashboard browser cookie.
 *
 * Token format: `<expMs>.<sig>` where
 *   expMs = unix-ms expiry (integer, serialised with String())
 *   sig   = base64url( HMAC-SHA256(key = DASHBOARD_TOKEN, message = String(expMs)) )
 *
 * Built on Web Crypto (`crypto.subtle`) so it runs unchanged on both the Edge
 * and Node.js runtimes (Next 16 middleware defaults to Node). The signing secret
 * is `process.env.DASHBOARD_TOKEN`; if it is unset the module fails closed —
 * `issueSession` returns "" and `verifySession` returns false, so no session can
 * ever be minted or accepted.
 *
 * The short ACCESS_CODE is NEVER stored in or accepted from the cookie: login
 * exchanges it for one of these tokens (see src/app/api/auth/login/route.ts).
 */

const encoder = new TextEncoder();
const DAY_MS = 24 * 60 * 60 * 1000;
const COOKIE = "ll_dash_auth";

/** URL-safe base64 with no padding, no external deps. */
export function base64url(buf: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return new Uint8Array(sig);
}

/** Length-checked, non-short-circuiting string compare. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Mint a signed session token valid for `ttlMs` (default 30 days).
 * Returns "" when `secret` is empty (fail closed).
 */
export async function issueSession(
  secret: string,
  ttlMs = 30 * DAY_MS,
): Promise<string> {
  if (!secret) return "";
  const expMs = Date.now() + ttlMs;
  const sig = base64url(await hmacSha256(secret, String(expMs)));
  return `${expMs}.${sig}`;
}

/**
 * Verify a session token's signature and expiry against `secret`.
 * Returns false on any malformed input or when `secret` is empty (fail closed).
 */
export async function verifySession(
  token: string,
  secret: string,
): Promise<boolean> {
  if (!secret || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;
  const expPart = token.slice(0, dot);
  const sigPart = token.slice(dot + 1);
  if (!/^\d+$/.test(expPart)) return false;
  const expected = base64url(await hmacSha256(secret, expPart));
  if (!safeEqual(sigPart, expected)) return false;
  return Number(expPart) > Date.now();
}

/**
 * Shared request-auth check for API route handlers that double-gate behind
 * middleware. Accepts either the signed `ll_dash_auth` session cookie or a
 * machine `Authorization: Bearer <DASHBOARD_TOKEN>` header. Fails closed when
 * DASHBOARD_TOKEN is unconfigured.
 */
export async function isRequestAuthed(req: {
  headers: { get(name: string): string | null };
  cookies: { get(name: string): { value: string } | undefined };
}): Promise<boolean> {
  const secret = process.env.DASHBOARD_TOKEN || "";
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  const cookie = req.cookies.get(COOKIE)?.value || "";
  return cookie ? verifySession(cookie, secret) : false;
}
