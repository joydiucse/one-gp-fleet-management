import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readUsers, writeUsers, toPublicUser } from "@/server/userStore";
import { appendAuditLog } from "@/server/audit";
import { signSession, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const users = await readUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());

  if (idx === -1) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const user = users[idx];

  if (user.status !== "Active") {
    return NextResponse.json({ error: "This account is inactive. Contact your Fleet Administrator." }, { status: 403 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const now = new Date().toISOString();
  users[idx] = { ...user, lastLogin: now };
  await writeUsers(users);

  const token = await signSession({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  });

  await appendAuditLog({
    user: user.name,
    action: "User Login",
    module: "User Management",
    details: `${user.name} (${user.role}) signed in.`,
  });

  const res = NextResponse.json({ user: toPublicUser(users[idx]) });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}
