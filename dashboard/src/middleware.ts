import { NextRequest, NextResponse } from "next/server";

/**
 * Auth gate for the LL OS dashboard.
 *
 * Browser: cookie `ll_dash_auth` set by POST /api/auth/login (ACCESS_CODE, e.g. 0613).
 * API: same cookie OR `Authorization: Bearer <ACCESS_CODE|DASHBOARD_TOKEN>`.
 *
 * HARD RULE: the whole app is gated (except login + static). Leaving `/` open
 * made it feel like "login worked" then every tab bounced back to login and
 * dumped Zach on the home page (2026-09-01).
 */

const TOKEN = process.env.DASHBOARD_TOKEN || "";
const ACCESS_CODE =
  process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN || "";
const COOKIE = "ll_dash_auth";

function isPublic(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname === "/api/auth/login") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  // public brand assets only
  if (pathname.startsWith("/icons/")) return true;
  return false;
}

function isAuthed(req: NextRequest): boolean {
  if (!TOKEN && !ACCESS_CODE) return false;
  const auth = req.headers.get("authorization") || "";
  const cookie = req.cookies.get(COOKIE)?.value || "";
  // Accept either the short access code or the long dashboard token in cookie/bearer.
  const okValues = [ACCESS_CODE, TOKEN].filter(Boolean);
  if (okValues.includes(cookie)) return true;
  for (const v of okValues) {
    if (auth === `Bearer ${v}`) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    // Already logged in? Don't trap on /login — send them where they were going.
    if (pathname === "/login" && isAuthed(req)) {
      const next = req.nextUrl.searchParams.get("next");
      const dest =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Fail closed if nothing configured
  if (!TOKEN && !ACCESS_CODE) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Dashboard auth not configured" },
        { status: 503 },
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!isAuthed(req)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", req.url);
    // Preserve deep link so Approvals/Leads don't dump to home after sign-in.
    const nextPath = pathname + (req.nextUrl.search || "");
    if (nextPath && nextPath !== "/") {
      login.searchParams.set("next", nextPath);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
