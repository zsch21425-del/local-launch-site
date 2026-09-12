import { NextResponse } from "next/server";
import { issueSession } from "@/lib/session";
import { isObject, badField, strMax } from "@/lib/validate";
import { recordFailure, recordSuccess } from "@/lib/login-guard";

// Short numeric access code for browser login (e.g. "0613"). Falls back to the
// longer DASHBOARD_TOKEN if ACCESS_CODE isn't set. The code is ONLY a login
// factor — on success we hand back an HMAC-signed session token, never the code.
const ACCESS_CODE = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN || "";
const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || "";
const COOKIE = "ll_dash_auth";

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

  // Durable, account-wide lockout (shared across instances). NOTE: we do NOT
  // block the whole endpoint on isLocked() here — that would let an attacker
  // DoS Zach by burning 10 bad PINs and locking even the CORRECT PIN out. The
  // correct PIN must ALWAYS work (it resets the counter below). The lockout only
  // throttles WRONG attempts, which is the brute-force brake.

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  // M06: reject wrong-shape bodies (null, numeric token, …) with a structured
  // 400 before they reach the checks below.
  if (!isObject(body)) {
    return NextResponse.json(
      { error: "Body must be a JSON object", field: "body" },
      { status: 400 },
    );
  }
  const bad = badField(body, { token: (v) => strMax(v, 200) });
  if (bad) {
    return NextResponse.json(
      { error: `Invalid or missing field: ${bad}`, field: bad },
      { status: 400 },
    );
  }

  const { token } = body as { token?: string };
  const okCodes = [ACCESS_CODE, DASHBOARD_TOKEN].filter(Boolean);
  if (!token || !okCodes.includes(token)) {
    // Record the failure against the GLOBAL budget (brute-force brake).
    const nowLocked = await recordFailure();
    if (nowLocked === "locked") {
      return NextResponse.json(
        { error: "Too many attempts — account locked. Try again later." },
        { status: 429 },
      );
    }
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  const session = await issueSession(DASHBOARD_TOKEN);
  if (!session) {
    return NextResponse.json(
      { error: "Dashboard auth not configured" },
      { status: 503 },
    );
  }

  // Successful login clears the failure counter + any lock.
  await recordSuccess();

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
