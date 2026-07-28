import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

// Behind a reverse proxy, req.url reflects the internal address Next.js is
// bound to (e.g. http://103.204.82.112:3000), not the public host/protocol
// the browser used. Redirects built from req.url send the browser to that
// internal address instead, which breaks login when the app is only
// reachable via a proxied http/https domain. Rebuild the origin from the
// forwarded headers so redirects stay on whatever host+protocol the client
// actually requested.
function getOrigin(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}`;
}

// Driver sessions share the same session cookie as office-user sessions, but
// drivers only get the in-app-view mobile UI plus the handful of read/update
// endpoints that UI needs — not the desktop app or its admin-only APIs.
function isAllowedForDriver(pathname: string, method: string): boolean {
  if (pathname.startsWith("/in-app-view")) return true;
  if (pathname.startsWith("/api/driver-auth")) return true;
  if (pathname === "/api/auth/me" || pathname === "/api/auth/logout") return true;
  if (pathname === "/api/requisitions" && method === "GET") return true;
  if (/^\/api\/requisitions\/[^/]+$/.test(pathname) && (method === "GET" || method === "PUT")) return true;
  if (pathname === "/api/vehicles" && method === "GET") return true;
  if (pathname === "/api/invoices" && method === "GET") return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySession(token) : null;
  const origin = getOrigin(req);
  const isDriver = payload?.role === "Driver";

  if (pathname === "/login") {
    if (payload) {
      return NextResponse.redirect(new URL(isDriver ? "/in-app-view" : "/", origin));
    }
    return NextResponse.next();
  }

  if (pathname === "/in-app-view/login") {
    if (payload) {
      return NextResponse.redirect(new URL("/in-app-view", origin));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/driver-auth")) {
    return NextResponse.next();
  }

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginPath = pathname.startsWith("/in-app-view") ? "/in-app-view/login" : "/login";
    const loginUrl = new URL(loginPath, origin);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isDriver && !isAllowedForDriver(pathname, req.method)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/in-app-view", origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
