import { NextRequest, NextResponse } from "next/server";
import { readUsers, writeUsers, toPublicUser, hashPassword, StoredUser } from "@/server/userStore";
import { appendAuditLog } from "@/server/audit";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const users = await readUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toPublicUser(user));
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<StoredUser> & { password?: string; __actor?: string };
  const { password, __actor, ...data } = body;
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const passwordHash = password && password.trim() ? await hashPassword(password) : users[idx].passwordHash;
  const updated: StoredUser = { ...users[idx], ...data, id, passwordHash };
  users[idx] = updated;
  await writeUsers(users);
  await appendAuditLog({
    user: __actor ?? "System",
    action: "Update User",
    module: "User Management",
    details: `Updated user ${updated.name} (${updated.role}).`,
  });
  return NextResponse.json(toPublicUser(updated));
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const actor = url.searchParams.get("actor") ?? "System";
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [removed] = users.splice(idx, 1);
  await writeUsers(users);
  await appendAuditLog({
    user: actor,
    action: "Delete User",
    module: "User Management",
    details: `Removed user ${removed.name}.`,
  });
  return NextResponse.json({ success: true });
}
