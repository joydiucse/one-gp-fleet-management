import { Prisma } from "@prisma/client";
import { prisma } from "./db";

// Business IDs (V-001, R-0001, INV-2026-06-001, ...) are the primary keys and
// appear in URLs, so they are issued here rather than left to AUTO_INCREMENT.
//
// The previous JSON implementation derived the next number by regexing the
// highest existing ID out of the whole collection. That reuses an ID after the
// highest record is deleted, and two concurrent requests could pick the same
// one. A dedicated counter row per sequence, incremented inside the caller's
// transaction, avoids both.

export type SequenceName =
  | "vehicles"
  | "drivers"
  | "vehicleCategories"
  | "fuelTypes"
  | "rateCards"
  | "requisitions"
  | "invoices"
  | "roles"
  | "users"
  | "auditLogs"
  | "integrationLogs";

interface SequenceSpec {
  prefix: string;
  width: number;
}

// Prefixes and padding widths match the IDs already present in the data, so
// newly created records are indistinguishable in shape from existing ones.
const SEQUENCES: Record<SequenceName, SequenceSpec> = {
  vehicles: { prefix: "V", width: 3 },
  drivers: { prefix: "D", width: 3 },
  vehicleCategories: { prefix: "VC", width: 3 },
  fuelTypes: { prefix: "FT", width: 3 },
  rateCards: { prefix: "RC", width: 3 },
  requisitions: { prefix: "R", width: 4 },
  invoices: { prefix: "INV", width: 3 },
  roles: { prefix: "ROLE", width: 3 },
  users: { prefix: "U", width: 3 },
  auditLogs: { prefix: "AL", width: 3 },
  integrationLogs: { prefix: "IL", width: 3 },
};

export interface AllocatedId {
  id: string;
  seq: number;
}

type Client = Prisma.TransactionClient | typeof prisma;

/**
 * Reserve the next number for a sequence and return it with the formatted ID.
 * Call inside a transaction so the reservation rolls back if the insert fails.
 */
export async function allocateId(client: Client, name: SequenceName): Promise<AllocatedId> {
  const row = await client.idSequence.upsert({
    where: { name },
    create: { name, nextValue: 2 },
    update: { nextValue: { increment: 1 } },
    select: { nextValue: true },
  });
  // `create` seeds nextValue at 2 because it hands out 1; `update` returns the
  // already-incremented value, so the number just handed out is one less.
  const seq = row.nextValue - 1;
  return { id: formatId(name, seq), seq };
}

/**
 * Invoice IDs embed the billing month (INV-2026-06-001) but the number itself
 * runs across all invoices, matching the existing records.
 */
export async function allocateInvoiceId(
  client: Client,
  billingMonth: string
): Promise<AllocatedId> {
  const { seq } = await allocateId(client, "invoices");
  const month = billingMonth || "0000-00";
  return { id: `INV-${month}-${String(seq).padStart(3, "0")}`, seq };
}

export function formatId(name: SequenceName, seq: number): string {
  const spec = SEQUENCES[name];
  return `${spec.prefix}-${String(seq).padStart(spec.width, "0")}`;
}

/**
 * Point a sequence at `nextValue`. Used by the importer to continue numbering
 * from the highest ID that came out of the JSON files.
 */
export async function setSequence(
  client: Client,
  name: SequenceName,
  nextValue: number
): Promise<void> {
  await client.idSequence.upsert({
    where: { name },
    create: { name, nextValue },
    update: { nextValue },
  });
}
