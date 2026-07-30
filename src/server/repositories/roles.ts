import type { Role } from "@/types";
import { prisma } from "../db";
import { allocateId } from "../ids";
import { DomainError, isForeignKeyViolation, isUniqueViolation } from "../errors";
import { toRole } from "../mappers";
import { asOptionalString, asString, type Repository } from "./types";

const INCLUDE = {
  permissions: { select: { permissionKey: true }, orderBy: { seq: "asc" } },
} as const;

const STATUSES = ["Active", "Inactive"] as const;
type RecordStatus = (typeof STATUSES)[number];

function asStatus(value: unknown, fallback: RecordStatus = "Active"): RecordStatus {
  const text = asString(value, fallback);
  return (STATUSES as readonly string[]).includes(text) ? (text as RecordStatus) : fallback;
}

/** Permissions arrive as an array of module keys; anything else is ignored. */
function asPermissions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const keys = value.filter((v): v is string => typeof v === "string" && v.trim() !== "");
  return [...new Set(keys)];
}

function duplicateName(name: string): DomainError {
  return new DomainError(`A role named '${name}' already exists.`, 409);
}

export const roleRepository: Repository<Role> = {
  async list() {
    const rows = await prisma.role.findMany({ include: INCLUDE, orderBy: { seq: "asc" } });
    return rows.map(toRole);
  },

  async find(id) {
    const row = await prisma.role.findUnique({ where: { id }, include: INCLUDE });
    return row ? toRole(row) : null;
  },

  async create(data) {
    const name = asString(data.name).trim();
    if (!name) throw new DomainError("Role name is required.");
    const permissions = asPermissions(data.permissions);

    try {
      const row = await prisma.$transaction(async (tx) => {
        const { id, seq } = await allocateId(tx, "roles");
        return tx.role.create({
          data: {
            id,
            seq,
            name,
            description: asOptionalString(data.description),
            status: asStatus(data.status),
            permissions: {
              create: permissions.map((permissionKey, index) => ({ permissionKey, seq: index })),
            },
          },
          include: INCLUDE,
        });
      });
      return toRole(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateName(name);
      throw error;
    }
  },

  async update(id, data) {
    const existing = await prisma.role.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    try {
      const row = await prisma.$transaction(async (tx) => {
        if ("permissions" in data) {
          // The permission set is replaced wholesale, matching how the Roles
          // dialog submits every checkbox on save.
          const permissions = asPermissions(data.permissions);
          await tx.rolePermission.deleteMany({ where: { roleId: id } });
          if (permissions.length > 0) {
            await tx.rolePermission.createMany({
              data: permissions.map((permissionKey, index) => ({
                roleId: id,
                permissionKey,
                seq: index,
              })),
            });
          }
        }

        const update: { name?: string; description?: string | null; status?: RecordStatus } = {};
        if ("name" in data) {
          const name = asString(data.name).trim();
          if (!name) throw new DomainError("Role name is required.");
          update.name = name;
        }
        if ("description" in data) update.description = asOptionalString(data.description);
        if ("status" in data) update.status = asStatus(data.status);

        return tx.role.update({ where: { id }, data: update, include: INCLUDE });
      });
      return toRole(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateName(asString(data.name));
      throw error;
    }
  },

  async remove(id) {
    const existing = await prisma.role.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) return null;
    try {
      // Permissions cascade; users do not, so a role still in use is refused.
      await prisma.role.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new DomainError(
          `Role '${existing.name}' is still assigned to one or more users and cannot be removed. Reassign those users first.`,
          409
        );
      }
      throw error;
    }
    return toRole(existing);
  },
};
