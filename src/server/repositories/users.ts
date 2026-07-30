import { prisma } from "../db";
import { allocateId } from "../ids";
import { DomainError, isUniqueViolation } from "../errors";
import { lastLoginToDb, toStoredUser } from "../mappers";
import type { StoredUser } from "../userStore";
import { asString } from "./types";

const INCLUDE = { role: { select: { name: true } } } as const;

const STATUSES = ["Active", "Inactive"] as const;
type RecordStatus = (typeof STATUSES)[number];

function asStatus(value: unknown, fallback: RecordStatus = "Active"): RecordStatus {
  const text = asString(value, fallback);
  return (STATUSES as readonly string[]).includes(text) ? (text as RecordStatus) : fallback;
}

function duplicateEmail(email: string): DomainError {
  return new DomainError(`A user with the email '${email}' already exists.`, 409);
}

/** Resolves a role name from a request body into its id. */
async function resolveRoleId(roleName: string): Promise<string> {
  const trimmed = roleName.trim();
  if (!trimmed) throw new DomainError("A role is required.");
  const row = await prisma.role.findUnique({ where: { name: trimmed }, select: { id: true } });
  if (!row) throw new DomainError(`Unknown role '${trimmed}'.`);
  return row.id;
}

export const userRepository = {
  async list(): Promise<StoredUser[]> {
    const rows = await prisma.user.findMany({ include: INCLUDE, orderBy: { seq: "asc" } });
    return rows.map(toStoredUser);
  },

  async find(id: string): Promise<StoredUser | null> {
    const row = await prisma.user.findUnique({ where: { id }, include: INCLUDE });
    return row ? toStoredUser(row) : null;
  },

  /** Case-insensitive lookup, matching how sign-in compared emails before. */
  async findByEmail(email: string): Promise<StoredUser | null> {
    const rows = await prisma.user.findMany({ include: INCLUDE });
    const target = email.trim().toLowerCase();
    const row = rows.find((candidate) => candidate.email.toLowerCase() === target);
    return row ? toStoredUser(row) : null;
  },

  async create(input: {
    name: string;
    email: string;
    role: string;
    status?: string;
    passwordHash: string;
  }): Promise<StoredUser> {
    const name = input.name.trim();
    const email = input.email.trim();
    if (!name || !email) throw new DomainError("Name and email are required.");
    const roleId = await resolveRoleId(input.role);

    try {
      const row = await prisma.$transaction(async (tx) => {
        const { id, seq } = await allocateId(tx, "users");
        return tx.user.create({
          data: {
            id,
            seq,
            name,
            email,
            roleId,
            status: asStatus(input.status),
            passwordHash: input.passwordHash,
            lastLogin: null,
          },
          include: INCLUDE,
        });
      });
      return toStoredUser(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateEmail(email);
      throw error;
    }
  },

  async update(
    id: string,
    input: {
      name?: unknown;
      email?: unknown;
      role?: unknown;
      status?: unknown;
      passwordHash?: string;
      lastLogin?: string | null;
    }
  ): Promise<StoredUser | null> {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    const update: {
      name?: string;
      email?: string;
      roleId?: string;
      status?: RecordStatus;
      passwordHash?: string;
      lastLogin?: string | null;
    } = {};

    if (input.name !== undefined) {
      const name = asString(input.name).trim();
      if (!name) throw new DomainError("Name is required.");
      update.name = name;
    }
    if (input.email !== undefined) {
      const email = asString(input.email).trim();
      if (!email) throw new DomainError("Email is required.");
      update.email = email;
    }
    if (input.role !== undefined) update.roleId = await resolveRoleId(asString(input.role));
    if (input.status !== undefined) update.status = asStatus(input.status);
    if (input.passwordHash !== undefined) update.passwordHash = input.passwordHash;
    if (input.lastLogin !== undefined) update.lastLogin = lastLoginToDb(input.lastLogin);

    try {
      const row = await prisma.user.update({ where: { id }, data: update, include: INCLUDE });
      return toStoredUser(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateEmail(asString(input.email));
      throw error;
    }
  },

  async remove(id: string): Promise<StoredUser | null> {
    const existing = await prisma.user.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) return null;
    await prisma.user.delete({ where: { id } });
    return toStoredUser(existing);
  },

  /** Records a successful sign-in. */
  async touchLastLogin(id: string, timestamp: string): Promise<void> {
    await prisma.user.update({ where: { id }, data: { lastLogin: timestamp } });
  },
};
