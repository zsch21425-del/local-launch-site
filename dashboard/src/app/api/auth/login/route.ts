import { NextResponse } from "next/server";

// Short numeric access code for browser login (e.g. "0613"). Falls back to the
// longer DASHBOARD_TOKEN if ACCESS_CODE isn't set, so existing setups keep working.
const ACCESS_CODE = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN || "";
const COOKIE = "ll_dash_auth";

/** POST /api/auth/login {token} — validates code, sets auth cookie. */
export async function POST(request: Request) {
  if (!ACCESS_CODE) {
    return NextResponse.json({ error: "Dashboard auth not configured" }, { status: 503 });
  }
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { token } = body as { token?: string };
  if (!token || token !== ACCESS_CODE) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, ACCESS_CODE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
