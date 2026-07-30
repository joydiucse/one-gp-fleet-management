import { Prisma } from "@prisma/client";
import type { Vehicle } from "@/types";
import type { CostVehicleFuel } from "@/lib/costReport";
import { prisma } from "../db";
import { allocateId } from "../ids";
import { DomainError, isForeignKeyViolation, isUniqueViolation } from "../errors";
import { toVehicle } from "../mappers";
import { resolveCategoryId, resolveFuelTypeId } from "./namedList";
import { asNumber, asOptionalString, asString, type Repository } from "./types";

const INCLUDE = {
  category: { select: { name: true } },
  fuelType: { select: { name: true } },
} as const;

const STATUSES = ["Active", "Inactive", "Maintenance"] as const;
type VehicleStatus = (typeof STATUSES)[number];

function asStatus(value: unknown, fallback: VehicleStatus = "Active"): VehicleStatus {
  const text = asString(value, fallback);
  return (STATUSES as readonly string[]).includes(text) ? (text as VehicleStatus) : fallback;
}

function asRentType(value: unknown): "Monthly" | "Daily" | null {
  const text = asOptionalString(value);
  return text === "Monthly" || text === "Daily" ? text : null;
}

/** The numeric rate and charge columns, with the field names used in the body. */
const MONEY_FIELDS = [
  "monthlyFixedRent",
  "perKmRate",
  "otRate",
  "personalUsageBill",
  "tollCharge",
  "parkingCharge",
  "startupFuelCharge",
  "mobileBill",
  "otherCharge",
] as const;

function duplicateNumber(vehicleNumber: string): DomainError {
  return new DomainError(`Vehicle number '${vehicleNumber}' is already registered.`, 409);
}

interface VehicleReportQueries {
  /** The distinct fuel types in use across the fleet, for filter dropdowns. */
  listFuelTypeNames(): Promise<string[]>;
  /** Vehicle number to fuel type, the join the fuel cost report needs. */
  listVehicleFuelTypes(): Promise<CostVehicleFuel[]>;
}

export const vehicleRepository: Repository<Vehicle> & VehicleReportQueries = {
  async list() {
    const rows = await prisma.vehicle.findMany({ include: INCLUDE, orderBy: { seq: "asc" } });
    return rows.map(toVehicle);
  },

  async listFuelTypeNames() {
    const rows = await prisma.vehicle.findMany({
      select: { fuelType: { select: { name: true } } },
      distinct: ["fuelTypeId"],
      orderBy: { fuelType: { name: "asc" } },
    });
    return rows.map((r) => r.fuelType.name);
  },

  async listVehicleFuelTypes() {
    const rows = await prisma.vehicle.findMany({
      select: { vehicleNumber: true, fuelType: { select: { name: true } } },
      orderBy: { seq: "asc" },
    });
    return rows.map((r) => ({ vehicleNumber: r.vehicleNumber, fuelType: r.fuelType.name }));
  },

  async find(id) {
    const row = await prisma.vehicle.findUnique({ where: { id }, include: INCLUDE });
    return row ? toVehicle(row) : null;
  },

  async create(data) {
    const vehicleNumber = asString(data.vehicleNumber).trim();
    if (!vehicleNumber) throw new DomainError("Vehicle number is required.");
    const partner = asString(data.partner).trim();
    if (!partner) throw new DomainError("Partner / vendor is required.");

    try {
      const row = await prisma.$transaction(async (tx) => {
        const categoryId = await resolveCategoryId(tx, asString(data.category));
        const fuelTypeId = await resolveFuelTypeId(tx, asString(data.fuelType));
        const { id, seq } = await allocateId(tx, "vehicles");

        const money = Object.fromEntries(
          MONEY_FIELDS.map((field) => [field, new Prisma.Decimal(asNumber(data[field]))])
        ) as Record<(typeof MONEY_FIELDS)[number], Prisma.Decimal>;

        return tx.vehicle.create({
          data: {
            id,
            seq,
            vehicleNumber,
            categoryId,
            fuelTypeId,
            seatCapacity: asNumber(data.seatCapacity, 4),
            partner,
            mobileNumber: asOptionalString(data.mobileNumber),
            rentType: asRentType(data.rentType),
            status: asStatus(data.status),
            ...money,
          },
          include: INCLUDE,
        });
      });
      return toVehicle(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw duplicateNumber(vehicleNumber);
      throw error;
    }
  },

  async update(id, data) {
    const existing = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    try {
      const row = await prisma.$transaction(async (tx) => {
        const update: Prisma.VehicleUpdateInput = {};

        if ("vehicleNumber" in data) {
          const vehicleNumber = asString(data.vehicleNumber).trim();
          if (!vehicleNumber) throw new DomainError("Vehicle number is required.");
          update.vehicleNumber = vehicleNumber;
        }
        if ("partner" in data) {
          const partner = asString(data.partner).trim();
          if (!partner) throw new DomainError("Partner / vendor is required.");
          update.partner = partner;
        }
        if ("category" in data) {
          update.category = {
            connect: { id: await resolveCategoryId(tx, asString(data.category)) },
          };
        }
        if ("fuelType" in data) {
          update.fuelType = {
            connect: { id: await resolveFuelTypeId(tx, asString(data.fuelType)) },
          };
        }
        if ("seatCapacity" in data) update.seatCapacity = asNumber(data.seatCapacity, 4);
        if ("mobileNumber" in data) update.mobileNumber = asOptionalString(data.mobileNumber);
        if ("rentType" in data) update.rentType = asRentType(data.rentType);
        if ("status" in data) update.status = asStatus(data.status);
        for (const field of MONEY_FIELDS) {
          if (field in data) update[field] = new Prisma.Decimal(asNumber(data[field]));
        }

        return tx.vehicle.update({ where: { id }, data: update, include: INCLUDE });
      });
      return toVehicle(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw duplicateNumber(asString(data.vehicleNumber));
      }
      throw error;
    }
  },

  async remove(id) {
    const existing = await prisma.vehicle.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) return null;
    try {
      await prisma.vehicle.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new DomainError(
          `Vehicle '${existing.vehicleNumber}' is referenced by billing records and cannot be removed. Set its status to Inactive instead.`,
          409
        );
      }
      throw error;
    }
    return toVehicle(existing);
  },
};
