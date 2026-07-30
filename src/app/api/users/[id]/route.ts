import { NextRequest, NextResponse } from "next/server";
import { toPublicUser, hashPassword } from "@/server/userStore";
import { userRepository } from "@/server/repositories/users";
import { appendAuditLog } from "@/server/audit";
import { errorResponse } from "@/server/errors";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const user = await userRepository.find(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(toPublicUser(user));
  } catch (error) {
    return errorResponse(error, "Failed to load user.");
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      role?: string;
      status?: string;
      password?: string;
      __actor?: string;
    };
    const { password, __actor } = body;

    const updated = await userRepository.update(id, {
      name: body.name,
      email: body.email,
      role: body.role,
      status: body.status,
      // An empty password field means "keep the current one".
      passwordHash: password && password.trim() ? await hashPassword(password) : undefined,
    });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await appendAuditLog({
      user: __actor ?? "System",
      action: "Update User",
      module: "User Management",
      details: `Updated user ${updated.name} (${updated.role}).`,
    });
    return NextResponse.json(toPublicUser(updated));
  } catch (error) {
    return errorResponse(error, "Failed to save user.");
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const actor = new URL(req.url).searchParams.get("actor") ?? "System";
    const removed = await userRepository.remove(id);
    if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await appendAuditLog({
      user: actor,
      action: "Delete User",
      module: "User Management",
      details: `Removed user ${removed.name}.`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Failed to remove user.");
  }
}
