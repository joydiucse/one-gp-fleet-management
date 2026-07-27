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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySession(token) : null;
  const origin = getOrigin(req);

  if (pathname === "/login") {
    if (payload) {
      return NextResponse.redirect(new URL("/", origin));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
