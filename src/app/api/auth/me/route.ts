import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySession(token) : null;

  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: payload.sub, name: payload.name, email: payload.email, role: payload.role },
  });
}
