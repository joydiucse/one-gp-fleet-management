import { Role } from "@/types";
import { prisma } from "./db";
import { toRole } from "./mappers";
import { roleRepository } from "./repositories/roles";

export async function readRoles(): Promise<Role[]> {
  return roleRepository.list();
}

/**
 * The permission keys granted to a role, looked up by name. Sign-in calls this
 * to build the session, so it reads the single role rather than the whole list.
 */
export async function permissionsForRole(roleName: string): Promise<string[]> {
  const row = await prisma.role.findUnique({
    where: { name: roleName },
    select: { permissions: { select: { permissionKey: true }, orderBy: { seq: "asc" } } },
  });
  return row?.permissions.map((p) => p.permissionKey) ?? [];
}

export { toRole };
