import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, toPublicUser } from "@/server/userStore";
import { userRepository } from "@/server/repositories/users";
import { permissionsForRole } from "@/server/roleStore";
import { appendAuditLog } from "@/server/audit";
import { signSession, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.status !== "Active") {
    return NextResponse.json({ error: "This account is inactive. Contact your Fleet Administrator." }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const now = new Date().toISOString();
  await userRepository.touchLastLogin(user.id, now);

  const permissions = await permissionsForRole(user.role);

  const token = await signSession({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions,
    exp: Date.now() + SESSION_TTL_MS,
  });

  await appendAuditLog({
    user: user.name,
    action: "User Login",
    module: "User Management",
    details: `${user.name} (${user.role}) signed in.`,
  });

  // `Secure` cookies are dropped by the browser on plain HTTP. NODE_ENV alone
  // can't tell us that — a production build can still be served over http://,
  // as it is here — so mark the cookie secure only when the actual request
  // (accounting for a reverse proxy) came in over https.
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" || req.nextUrl.protocol === "https:";

  const res = NextResponse.json({
    user: { ...toPublicUser({ ...user, lastLogin: now }), permissions },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}
