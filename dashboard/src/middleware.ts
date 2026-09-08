import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

/**
 * Auth gate for the LL OS dashboard.
 *
 * Browser: cookie `ll_dash_auth` — an HMAC-signed, expiring session token minted
 *   by POST /api/auth/login and verified here against DASHBOARD_TOKEN. The raw
 *   ACCESS_CODE is NEVER accepted as a credential; login exchanges it for a
 *   session (see src/lib/session.ts).
 * API: `Authorization: Bearer <DASHBOARD_TOKEN>` only (long machine token).
 *
 * Fails closed when DASHBOARD_TOKEN is unconfigured — 503 for `/api/*`,
 * redirect to /login otherwise.
 *
 * HARD RULE: the whole app is gated (except login + static). Leaving `/` open
 * made it feel like "login worked" then every tab bounced back to login and
 * dumped Zach on the home page (2026-09-01).
 */

const TOKEN = process.env.DASHBOARD_TOKEN || "";
const COOKIE = "ll_dash_auth";

function isPublic(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname === "/api/auth/login") return true;
  if (pathname === "/api/auth/logout") return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  // public brand assets only
  if (pathname.startsWith("/icons/")) return true;
  return false;
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  if (!TOKEN) return false;
  const auth = req.headers.get("authorization") || "";
  // Machine token: the long DASHBOARD_TOKEN as a Bearer credential.
  if (auth === `Bearer ${TOKEN}`) return true;
  // Browser: a signed, unexpired session cookie.
  const cookie = req.cookies.get(COOKIE)?.value || "";
  if (cookie && (await verifySession(cookie, TOKEN))) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    // Already logged in? Don't trap on /login — send them where they were going.
    if (pathname === "/login" && (await isAuthed(req))) {
      const next = req.nextUrl.searchParams.get("next");
      const dest =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Fail closed if the signing secret isn't configured.
  if (!TOKEN) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Dashboard auth not configured" },
        { status: 503 },
      );
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!(await isAuthed(req))) {
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
