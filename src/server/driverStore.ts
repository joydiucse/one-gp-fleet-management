import { Driver } from "@/types";
import { prisma } from "./db";
import { toDriver } from "./mappers";
import { normalizeMobile } from "./mobile";

export { normalizeMobile };

export async function readDrivers(): Promise<Driver[]> {
  const rows = await prisma.driver.findMany({ orderBy: { seq: "asc" } });
  return rows.map(toDriver);
}

/**
 * Driver sign-in identifies the driver by mobile number. The digits-only form
 * is stored in its own unique column so this is an index lookup rather than a
 * scan that normalises every row.
 */
export async function findDriverByMobile(mobile: string): Promise<Driver | null> {
  const normalized = normalizeMobile(mobile);
  if (!normalized) return null;
  const row = await prisma.driver.findUnique({ where: { mobileNormalized: normalized } });
  return row ? toDriver(row) : null;
}
