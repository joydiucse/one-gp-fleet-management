import { Prisma } from "@prisma/client";
import type { Driver } from "@/types";
import { prisma } from "../db";
import { allocateId } from "../ids";
import { DomainError, isForeignKeyViolation, isUniqueViolation } from "../errors";
import { toDriver } from "../mappers";
import { normalizeMobile } from "../mobile";
import { asString, type Repository } from "./types";

const STATUSES = ["Active", "Inactive", "Suspended"] as const;
type DriverStatus = (typeof STATUSES)[number];

function asStatus(value: unknown, fallback: DriverStatus = "Active"): DriverStatus {
  const text = asString(value, fallback);
  return (STATUSES as readonly string[]).includes(text) ? (text as DriverStatus) : fallback;
}

function duplicateMobile(mobile: string): DomainError {
  return new DomainError(`Mobile number '${mobile}' is already registered to another driver.`, 409);
}

export const driverRepository: Repository<Driver> = {
  async list() {
    const rows = await prisma.driver.findMany({ orderBy: { seq: "asc" } });
    return rows.map(toDriver);
  },

  async find(id) {
    const row = await prisma.driver.findUnique({ where: { id } });
    return row ? toDriver(row) : null;
  },

  async create(data) {
    const name = asString(data.name).trim();
    const mobile = asString(data.mobile).trim();
    const licenseNumber = asString(data.licenseNumber).trim();
    const nidNumber = asString(data.nidNumber).trim();
    if (!name || !mobile || !licenseNumber || !nidNumber) {
      throw new DomainError("Name, mobile, license and NID number are required.");
    }
    const mobileNormalized = normalizeMobile(mobile);
    if (!mobileNormalized) throw new DomainError("Mobile number must contain digits.");

    try {
      const row = await prisma.$transaction(async (tx) => {
        const { id, seq } = await allocateId(tx, "drivers");
        return tx.driver.create({
          data: {
            id,
            seq,
            name,
            mobile,
            mobileNormalized,
            licenseNumber,
            licenseAttachment: asString(data.licenseAttachment),
            nidNumber,
            nidAttachment: asString(data.nidAttachment),
            vendor: asString(data.vendor),
            status: asStatus(data.status),
          },
        });
      });
      return toDriver(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateMobile(mobile);
      throw error;
    }
  },

  async update(id, data) {
    const existing = await prisma.driver.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    const update: Prisma.DriverUpdateInput = {};

    if ("name" in data) {
      const name = asString(data.name).trim();
      if (!name) throw new DomainError("Driver name is required.");
      update.name = name;
    }
    if ("mobile" in data) {
      const mobile = asString(data.mobile).trim();
      const mobileNormalized = normalizeMobile(mobile);
      if (!mobile || !mobileNormalized) throw new DomainError("A valid mobile number is required.");
      update.mobile = mobile;
      update.mobileNormalized = mobileNormalized;
    }
    if ("licenseNumber" in data) {
      const licenseNumber = asString(data.licenseNumber).trim();
      if (!licenseNumber) throw new DomainError("Driving license number is required.");
      update.licenseNumber = licenseNumber;
    }
    if ("nidNumber" in data) {
      const nidNumber = asString(data.nidNumber).trim();
      if (!nidNumber) throw new DomainError("NID number is required.");
      update.nidNumber = nidNumber;
    }
    if ("licenseAttachment" in data) update.licenseAttachment = asString(data.licenseAttachment);
    if ("nidAttachment" in data) update.nidAttachment = asString(data.nidAttachment);
    if ("vendor" in data) update.vendor = asString(data.vendor);
    if ("status" in data) update.status = asStatus(data.status);

    try {
      const row = await prisma.driver.update({ where: { id }, data: update });
      return toDriver(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateMobile(asString(data.mobile));
      throw error;
    }
  },

  async remove(id) {
    const existing = await prisma.driver.findUnique({ where: { id } });
    if (!existing) return null;
    try {
      await prisma.driver.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new DomainError(
          `Driver '${existing.name}' is referenced by other records and cannot be removed. Set the status to Inactive instead.`,
          409
        );
      }
      throw error;
    }
    return toDriver(existing);
  },
};
