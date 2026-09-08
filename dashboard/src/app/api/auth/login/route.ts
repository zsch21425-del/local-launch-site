import { NextResponse } from "next/server";
import { issueSession } from "@/lib/session";

// Short numeric access code for browser login (e.g. "0613"). Falls back to the
// longer DASHBOARD_TOKEN if ACCESS_CODE isn't set. The code is ONLY a login
// factor — on success we hand back an HMAC-signed session token, never the code.
const ACCESS_CODE = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN || "";
const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || "";
const COOKIE = "ll_dash_auth";

// ── In-memory login rate limiter (per serverless instance) ──
// Best-effort brute-force brake keyed by client IP: ~10 attempts / 10 min.
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  return first || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

/** POST /api/auth/login {token} — validates code, sets signed-session cookie. */
export async function POST(request: Request) {
  // DASHBOARD_TOKEN is the session signing secret — without it we cannot mint a
  // verifiable session, so fail closed even if ACCESS_CODE happens to be set.
  if (!DASHBOARD_TOKEN) {
    return NextResponse.json(
      { error: "Dashboard auth not configured" },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { token } = body as { token?: string };
  const okCodes = [ACCESS_CODE, DASHBOARD_TOKEN].filter(Boolean);
  if (!token || !okCodes.includes(token)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const session = await issueSession(DASHBOARD_TOKEN);
  if (!session) {
    return NextResponse.json(
      { error: "Dashboard auth not configured" },
      { status: 503 },
    );
  }

  const res = NextResponse.json({ ok: true });
  // Vercel is always HTTPS — force Secure so mobile/in-app browsers keep the cookie.
  const onVercel =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: onVercel,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
