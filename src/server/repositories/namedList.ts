import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { allocateId } from "../ids";
import { DomainError, isForeignKeyViolation, isUniqueViolation } from "../errors";
import { asString, type Repository } from "./types";

/**
 * Vehicle Category and Fuel Type are both `{ id, name }` lists referenced by
 * vehicles and rate cards, so they share the same rules: the name is required,
 * names are unique, and a value still in use cannot be deleted.
 *
 * Prisma generates a distinct delegate type per model that cannot be unified
 * structurally, so the caller supplies closures over its own model and this
 * factory adds the shared validation and error translation around them.
 */

export interface NamedItem {
  id: string;
  name: string;
}

export const NAMED_SELECT = { id: true, name: true } as const;

interface NamedListOps {
  list(): Promise<NamedItem[]>;
  find(id: string): Promise<NamedItem | null>;
  create(name: string): Promise<NamedItem>;
  rename(id: string, name: string): Promise<NamedItem>;
  destroy(id: string): Promise<void>;
}

export function namedListRepository(label: string, ops: NamedListOps): Repository<NamedItem> {
  function requireName(data: Record<string, unknown>): string {
    const name = asString(data.name).trim();
    if (!name) throw new DomainError(`${label} name is required.`);
    return name;
  }

  function duplicate(): DomainError {
    return new DomainError(`This ${label.toLowerCase()} already exists.`, 409);
  }

  return {
    list: ops.list,
    find: ops.find,

    async create(data) {
      const name = requireName(data);
      try {
        return await ops.create(name);
      } catch (error) {
        if (isUniqueViolation(error)) throw duplicate();
        throw error;
      }
    },

    async update(id, data) {
      const existing = await ops.find(id);
      if (!existing) return null;
      const name = requireName(data);
      try {
        return await ops.rename(id, name);
      } catch (error) {
        if (isUniqueViolation(error)) throw duplicate();
        throw error;
      }
    },

    async remove(id) {
      const existing = await ops.find(id);
      if (!existing) return null;
      try {
        await ops.destroy(id);
      } catch (error) {
        if (isForeignKeyViolation(error)) {
          throw new DomainError(
            `'${existing.name}' is still used by one or more vehicles or rate cards and cannot be removed. Reassign or remove those records first.`,
            409
          );
        }
        throw error;
      }
      return existing;
    },
  };
}

// ------------------------------------------------------------------ concrete lists

export const vehicleCategoryRepository = namedListRepository("Vehicle Category", {
  list: () => prisma.vehicleCategory.findMany({ select: NAMED_SELECT, orderBy: { seq: "asc" } }),
  find: (id) => prisma.vehicleCategory.findUnique({ where: { id }, select: NAMED_SELECT }),
  create: (name) =>
    prisma.$transaction(async (tx) => {
      const { id, seq } = await allocateId(tx, "vehicleCategories");
      return tx.vehicleCategory.create({ data: { id, seq, name }, select: NAMED_SELECT });
    }),
  rename: (id, name) =>
    prisma.vehicleCategory.update({ where: { id }, data: { name }, select: NAMED_SELECT }),
  destroy: async (id) => {
    await prisma.vehicleCategory.delete({ where: { id } });
  },
});

export const fuelTypeRepository = namedListRepository("Fuel Type", {
  list: () => prisma.fuelType.findMany({ select: NAMED_SELECT, orderBy: { seq: "asc" } }),
  find: (id) => prisma.fuelType.findUnique({ where: { id }, select: NAMED_SELECT }),
  create: (name) =>
    prisma.$transaction(async (tx) => {
      const { id, seq } = await allocateId(tx, "fuelTypes");
      return tx.fuelType.create({ data: { id, seq, name }, select: NAMED_SELECT });
    }),
  rename: (id, name) =>
    prisma.fuelType.update({ where: { id }, data: { name }, select: NAMED_SELECT }),
  destroy: async (id) => {
    await prisma.fuelType.delete({ where: { id } });
  },
});

// ------------------------------------------------------------------ name -> id

function unknownValue(label: string, name: string): DomainError {
  return new DomainError(
    `Unknown ${label.toLowerCase()} '${name}'. Add it to the master list first.`
  );
}

function requireValue(name: string, label: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new DomainError(`${label} is required.`);
  return trimmed;
}

/**
 * Vehicles and rate cards arrive carrying a category name, because that is what
 * the dropdowns and the JSON API expose. An unknown value means the master
 * record was removed between page load and submit.
 */
export async function resolveCategoryId(
  client: Prisma.TransactionClient,
  name: string
): Promise<string> {
  const trimmed = requireValue(name, "Vehicle category");
  const row = await client.vehicleCategory.findUnique({
    where: { name: trimmed },
    select: { id: true },
  });
  if (!row) throw unknownValue("Vehicle category", trimmed);
  return row.id;
}

export async function resolveFuelTypeId(
  client: Prisma.TransactionClient,
  name: string
): Promise<string> {
  const trimmed = requireValue(name, "Fuel type");
  const row = await client.fuelType.findUnique({
    where: { name: trimmed },
    select: { id: true },
  });
  if (!row) throw unknownValue("Fuel type", trimmed);
  return row.id;
}
