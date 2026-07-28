import { NextRequest, NextResponse } from "next/server";
import { readDrivers, normalizeMobile } from "@/server/driverStore";
import { appendAuditLog } from "@/server/audit";
import { signSession, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { mobile, password } = (await req.json()) as { mobile?: string; password?: string };

  if (!mobile || !password) {
    return NextResponse.json({ error: "Mobile number and password are required." }, { status: 400 });
  }

  const drivers = await readDrivers();
  const normalizedInput = normalizeMobile(mobile);
  const driver = drivers.find((d) => normalizeMobile(d.mobile) === normalizedInput);

  // Drivers don't have a separate password on file yet — the password is
  // their own mobile number until a dedicated credential is introduced.
  if (!driver || normalizeMobile(password) !== normalizeMobile(driver.mobile)) {
    return NextResponse.json({ error: "Invalid mobile number or password." }, { status: 401 });
  }

  if (driver.status !== "Active") {
    return NextResponse.json(
      { error: "This driver account is inactive. Contact your Fleet Administrator." },
      { status: 403 }
    );
  }

  const token = await signSession({
    sub: driver.id,
    name: driver.name,
    email: driver.mobile,
    role: "Driver",
    exp: Date.now() + SESSION_TTL_MS,
  });

  await appendAuditLog({
    user: driver.name,
    action: "Driver Login",
    module: "Driver Management",
    details: `${driver.name} signed in from the driver app.`,
  });

  // `Secure` cookies are dropped by the browser on plain HTTP. NODE_ENV alone
  // can't tell us that — a production build can still be served over http://,
  // as it is here — so mark the cookie secure only when the actual request
  // (accounting for a reverse proxy) came in over https.
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" || req.nextUrl.protocol === "https:";

  const res = NextResponse.json({
    user: { id: driver.id, name: driver.name, email: driver.mobile, role: "Driver" },
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
