import { NextResponse } from "next/server";

const COOKIE = "ll_dash_auth";

/** POST /api/auth/logout — clears the dashboard auth cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  const onVercel =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: onVercel,
    maxAge: 0,
    path: "/",
  });
  return res;
}
