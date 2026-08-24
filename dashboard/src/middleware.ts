import { NextRequest, NextResponse } from "next/server";

/**
 * Auth gate for the LL OS dashboard.
 * Every /api/* route and the protected pages require a bearer token
 * (DASHBOARD_TOKEN) or the request is rejected. This protects the fleet
 * command center (agent dispatch, activity feeds with PII, approvals that
 * trigger outbound client emails) from anonymous access on the public URL.
 *
 * Token: set DASHBOARD_TOKEN in .env.local / Vercel env.
 * Browser access: the app sets a cookie after a simple login (see /login page),
 * or clients send `Authorization: Bearer <token>` on API calls.
 */

const TOKEN = process.env.DASHBOARD_TOKEN || "";
// Short numeric access code for browser login. Falls back to DASHBOARD_TOKEN.
const ACCESS_CODE = process.env.ACCESS_CODE || process.env.DASHBOARD_TOKEN || "";
const COOKIE = "ll_dash_auth";

function isProtected(pathname: string): boolean {
  // Protect every API route + the fleet/client pages (PII + control plane)
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/fleet")) return true;
  if (pathname.startsWith("/client/")) return true;
  if (pathname.startsWith("/clients")) return true;
  if (pathname.startsWith("/approvals")) return true;
  if (pathname.startsWith("/leads")) return true;
  if (pathname.startsWith("/reports")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page + login API + static assets (no auth needed)
  if (
    pathname === "/login" ||
    pathname === "/api/auth/login" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // If no token configured, fail CLOSED (never silently open)
  if (!TOKEN) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Dashboard auth not configured" }, { status: 503 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check Authorization header (API + programmatic) or cookie (browser pages)
  const auth = req.headers.get("authorization") || "";
  const cookie = req.cookies.get(COOKIE)?.value || "";
  const valid =
    cookie === ACCESS_CODE ||
    auth === `Bearer ${ACCESS_CODE}` ||
    (TOKEN && (cookie === TOKEN || auth === `Bearer ${TOKEN}`));

  if (!valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
