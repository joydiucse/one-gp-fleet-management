import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog } from "@/server/audit";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySession(token) : null;

  if (payload) {
    await appendAuditLog({
      user: payload.name,
      action: "User Logout",
      module: "User Management",
      details: `${payload.name} (${payload.role}) signed out.`,
    });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
