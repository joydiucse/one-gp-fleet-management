import { NextRequest, NextResponse } from "next/server";
import { readUsers, writeUsers, toPublicUser, hashPassword, DEFAULT_PASSWORD_HASH, StoredUser } from "@/server/userStore";
import { appendAuditLog } from "@/server/audit";

export const runtime = "nodejs";

export async function GET() {
  const users = await readUsers();
  return NextResponse.json(users.map(toPublicUser));
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<StoredUser> & { password?: string; __actor?: string };
  const { password, __actor, ...data } = body;
  const users = await readUsers();

  let maxSeq = 0;
  for (const u of users) {
    const match = /(\d+)$/.exec(u.id);
    if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
  }
  const id = `U-${String(maxSeq + 1).padStart(3, "0")}`;

  const passwordHash = password ? await hashPassword(password) : DEFAULT_PASSWORD_HASH;
  const created: StoredUser = {
    id,
    name: data.name ?? "",
    email: data.email ?? "",
    role: data.role ?? "Read Only",
    status: data.status ?? "Active",
    lastLogin: "—",
    passwordHash,
  };
  users.push(created);
  await writeUsers(users);
  await appendAuditLog({
    user: __actor ?? "System",
    action: "Create User",
    module: "User Management",
    details: `Added new user ${created.name} with role ${created.role}.`,
  });
  return NextResponse.json(toPublicUser(created), { status: 201 });
}
