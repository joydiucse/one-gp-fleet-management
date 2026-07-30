import { Prisma } from "@prisma/client";
import type { RateCard } from "@/types";
import { prisma } from "../db";
import { allocateId } from "../ids";
import { DomainError, isUniqueViolation } from "../errors";
import { toRateCard } from "../mappers";
import { resolveCategoryId, resolveFuelTypeId } from "./namedList";
import { asNumber, asString, type Repository } from "./types";

const INCLUDE = {
  category: { select: { name: true } },
  fuelType: { select: { name: true } },
} as const;

// Wording matches what the Rate Card page already shows for this rule, which is
// now also enforced by a unique index on (category_id, fuel_type_id).
const DUPLICATE_MESSAGE =
  "A rate card for this Category + Fuel Type combination already exists.";

export const rateCardRepository: Repository<RateCard> = {
  async list() {
    const rows = await prisma.rateCard.findMany({ include: INCLUDE, orderBy: { seq: "asc" } });
    return rows.map(toRateCard);
  },

  async find(id) {
    const row = await prisma.rateCard.findUnique({ where: { id }, include: INCLUDE });
    return row ? toRateCard(row) : null;
  },

  async create(data) {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const categoryId = await resolveCategoryId(tx, asString(data.category));
        const fuelTypeId = await resolveFuelTypeId(tx, asString(data.fuelType));
        const { id, seq } = await allocateId(tx, "rateCards");
        return tx.rateCard.create({
          data: {
            id,
            seq,
            categoryId,
            fuelTypeId,
            monthlyFixedRent: new Prisma.Decimal(asNumber(data.monthlyFixedRent)),
            perKmRate: new Prisma.Decimal(asNumber(data.perKmRate)),
            otRatePerHour: new Prisma.Decimal(asNumber(data.otRatePerHour)),
          },
          include: INCLUDE,
        });
      });
      return toRateCard(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new DomainError(DUPLICATE_MESSAGE, 409);
      throw error;
    }
  },

  async update(id, data) {
    const existing = await prisma.rateCard.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    try {
      const row = await prisma.$transaction(async (tx) => {
        const update: Prisma.RateCardUpdateInput = {};

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
        if ("monthlyFixedRent" in data) {
          update.monthlyFixedRent = new Prisma.Decimal(asNumber(data.monthlyFixedRent));
        }
        if ("perKmRate" in data) {
          update.perKmRate = new Prisma.Decimal(asNumber(data.perKmRate));
        }
        if ("otRatePerHour" in data) {
          update.otRatePerHour = new Prisma.Decimal(asNumber(data.otRatePerHour));
        }

        return tx.rateCard.update({ where: { id }, data: update, include: INCLUDE });
      });
      return toRateCard(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new DomainError(DUPLICATE_MESSAGE, 409);
      throw error;
    }
  },

  async remove(id) {
    const existing = await prisma.rateCard.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) return null;
    await prisma.rateCard.delete({ where: { id } });
    return toRateCard(existing);
  },
};
