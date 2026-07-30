import { NextRequest, NextResponse } from "next/server";
import {
  readUsers,
  toPublicUser,
  hashPassword,
  DEFAULT_PASSWORD_HASH,
} from "@/server/userStore";
import { userRepository } from "@/server/repositories/users";
import { appendAuditLog } from "@/server/audit";
import { errorResponse } from "@/server/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const users = await readUsers();
    return NextResponse.json(users.map(toPublicUser));
  } catch (error) {
    return errorResponse(error, "Failed to load users.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      role?: string;
      status?: string;
      password?: string;
      __actor?: string;
    };
    const { password, __actor } = body;

    const created = await userRepository.create({
      name: body.name ?? "",
      email: body.email ?? "",
      role: body.role ?? "Read Only",
      status: body.status,
      passwordHash: password ? await hashPassword(password) : DEFAULT_PASSWORD_HASH,
    });

    await appendAuditLog({
      user: __actor ?? "System",
      action: "Create User",
      module: "User Management",
      details: `Added new user ${created.name} with role ${created.role}.`,
    });
    return NextResponse.json(toPublicUser(created), { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to save user.");
  }
}
