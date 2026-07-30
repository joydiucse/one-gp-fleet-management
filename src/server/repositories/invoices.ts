import { Prisma } from "@prisma/client";
import type { Invoice, InvoiceCharges, InvoiceStatus } from "@/types";
import { calculateTotalBill } from "@/lib/billing";
import { prisma } from "../db";
import { allocateInvoiceId } from "../ids";
import { chargesToDb, invoiceStatusToDb, toInvoice, toInvoiceCharges } from "../mappers";
import { asNumber, asOptionalString, asString } from "./types";

const INCLUDE = { charges: true } as const;

const INVOICE_STATUSES: InvoiceStatus[] = [
  "Draft",
  "Pending Approval",
  "Approved",
  "Paid",
  "Rejected",
];

function asInvoiceStatus(value: unknown, fallback: InvoiceStatus = "Draft"): InvoiceStatus {
  const text = asString(value, fallback);
  return (INVOICE_STATUSES as string[]).includes(text) ? (text as InvoiceStatus) : fallback;
}

/** Zero-filled charges, used when a new invoice arrives without any. */
export function emptyCharges(): InvoiceCharges {
  return {
    fixedRent: 0,
    personalUsageBill: 0,
    distanceKm: 0,
    kmRate: 0,
    distanceCharge: 0,
    otHours: 0,
    otCharge: 0,
    tollCharge: 0,
    parkingCharge: 0,
    startupFuelCharge: 0,
    mobileBill: 0,
    otherCharges: 0,
    driverDaDays: 0,
    driverDaAmount: 0,
    extraServiceRate: 0,
    extraServiceHour: 0,
    extraServiceAmount: 0,
    adjustmentAbsent: 0,
    iftarBillRate: 0,
    iftarBillDays: 0,
    iftarBillAmount: 0,
  };
}

/** Normalises a charges object from a request body into a complete one. */
export function coerceCharges(value: unknown): InvoiceCharges {
  const base = emptyCharges();
  if (typeof value !== "object" || value === null) return base;
  const input = value as Record<string, unknown>;
  const merged = { ...base } as Record<string, unknown>;
  for (const [key, current] of Object.entries(base)) {
    if (key in input) merged[key] = asNumber(input[key], current as number);
  }
  // The two text fields on charges are not numeric.
  if ("usageFrom" in input) merged.usageFrom = asOptionalString(input.usageFrom) ?? undefined;
  if ("usageTo" in input) merged.usageTo = asOptionalString(input.usageTo) ?? undefined;
  return merged as unknown as InvoiceCharges;
}

async function resolveVehicleId(
  client: Prisma.TransactionClient,
  vehicleNumber: string
): Promise<string | null> {
  if (!vehicleNumber) return null;
  const row = await client.vehicle.findUnique({ where: { vehicleNumber }, select: { id: true } });
  return row?.id ?? null;
}

export const invoiceRepository = {
  async list(): Promise<Invoice[]> {
    const rows = await prisma.invoice.findMany({ include: INCLUDE, orderBy: { seq: "asc" } });
    return rows.map(toInvoice);
  },

  /** The distinct vehicle categories billed, for report filter dropdowns. */
  async listCategoryNames(): Promise<string[]> {
    const rows = await prisma.invoice.findMany({
      select: { vehicleCategory: true },
      distinct: ["vehicleCategory"],
      orderBy: { vehicleCategory: "asc" },
    });
    return rows.map((r) => r.vehicleCategory);
  },

  /** Only the invoices of one billing month — used by the billing reports. */
  async listForBillingMonth(billingMonth: string): Promise<Invoice[]> {
    const rows = await prisma.invoice.findMany({
      where: { billingMonth },
      include: INCLUDE,
      orderBy: { seq: "asc" },
    });
    return rows.map(toInvoice);
  },

  async find(id: string): Promise<Invoice | null> {
    const row = await prisma.invoice.findUnique({ where: { id }, include: INCLUDE });
    return row ? toInvoice(row) : null;
  },

  /**
   * Finds the open (Draft) invoice a completed trip should roll into. Once a
   * month's invoice has moved past Draft it is closed for new trips, and a
   * further completed trip opens a new one.
   */
  async findDraftFor(vehicleNumber: string, billingMonth: string): Promise<Invoice | null> {
    const row = await prisma.invoice.findFirst({
      where: { vehicleNumber, billingMonth, status: "Draft" },
      include: INCLUDE,
      orderBy: { seq: "asc" },
    });
    return row ? toInvoice(row) : null;
  },

  async create(data: Record<string, unknown>): Promise<Invoice> {
    const billingMonth = asString(data.billingMonth);
    const vehicleNumber = asString(data.vehicleNumber);
    const charges = coerceCharges(data.charges);

    const row = await prisma.$transaction(async (tx) => {
      const { id, seq } = await allocateInvoiceId(tx, billingMonth);
      return tx.invoice.create({
        data: {
          id,
          seq,
          invoiceNumber: asString(data.invoiceNumber, id),
          vehicleId: await resolveVehicleId(tx, vehicleNumber),
          vehicleNumber,
          vehicleCategory: asString(data.vehicleCategory, "Sedan"),
          partner: asString(data.partner),
          billingMonth,
          tripCount: asNumber(data.tripCount),
          totalBill: new Prisma.Decimal(calculateTotalBill(charges)),
          status: invoiceStatusToDb(asInvoiceStatus(data.status)),
          generatedDate: asString(data.generatedDate, new Date().toISOString()),
          approvedBy: null,
          approvedDate: null,
          adjustmentNote: asOptionalString(data.adjustmentNote),
          charges: { create: chargesToDb(charges) },
        },
        include: INCLUDE,
      });
    });

    return toInvoice(row);
  },

  /**
   * Merges `data` into the invoice and recalculates the total, mirroring what
   * the invoice PUT endpoint did against the JSON file.
   */
  async update(id: string, data: Record<string, unknown>): Promise<Invoice | null> {
    const existing = await prisma.invoice.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) return null;

    const charges =
      "charges" in data ? coerceCharges(data.charges) : toInvoiceCharges(existing.charges);

    const update: Prisma.InvoiceUncheckedUpdateInput = {
      totalBill: new Prisma.Decimal(calculateTotalBill(charges)),
    };
    if ("invoiceNumber" in data) update.invoiceNumber = asString(data.invoiceNumber);
    if ("vehicleCategory" in data) update.vehicleCategory = asString(data.vehicleCategory);
    if ("partner" in data) update.partner = asString(data.partner);
    if ("billingMonth" in data) update.billingMonth = asString(data.billingMonth);
    if ("tripCount" in data) update.tripCount = asNumber(data.tripCount);
    if ("status" in data) update.status = invoiceStatusToDb(asInvoiceStatus(data.status));
    if ("generatedDate" in data) update.generatedDate = asString(data.generatedDate);
    if ("approvedBy" in data) update.approvedBy = asOptionalString(data.approvedBy);
    if ("approvedDate" in data) update.approvedDate = asOptionalString(data.approvedDate);
    if ("adjustmentNote" in data) update.adjustmentNote = asOptionalString(data.adjustmentNote);

    const row = await prisma.$transaction(async (tx) => {
      if ("vehicleNumber" in data) {
        const vehicleNumber = asString(data.vehicleNumber);
        update.vehicleNumber = vehicleNumber;
        update.vehicleId = await resolveVehicleId(tx, vehicleNumber);
      }
      await tx.invoice.update({ where: { id }, data: update });
      await tx.invoiceCharge.upsert({
        where: { invoiceId: id },
        create: { invoiceId: id, ...chargesToDb(charges) },
        update: chargesToDb(charges),
      });
      return tx.invoice.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    });

    return toInvoice(row);
  },

  /** Applies a status transition, stamping the approver on terminal states. */
  async setStatus(
    id: string,
    status: InvoiceStatus,
    actor: string,
    note?: string
  ): Promise<Invoice | null> {
    const existing = await prisma.invoice.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) return null;

    const isTerminalAction = status === "Approved" || status === "Paid" || status === "Rejected";
    const row = await prisma.invoice.update({
      where: { id },
      data: {
        status: invoiceStatusToDb(status),
        approvedBy: isTerminalAction ? actor : existing.approvedBy,
        approvedDate: isTerminalAction ? new Date().toISOString() : existing.approvedDate,
        adjustmentNote: note ?? existing.adjustmentNote,
      },
      include: INCLUDE,
    });
    return toInvoice(row);
  },

  /**
   * Adds a manual adjustment to Other Approved Charges and records the reason.
   * Returns null when the invoice does not exist.
   */
  async applyAdjustment(
    id: string,
    amount: number,
    note: string
  ): Promise<{ invoice: Invoice; noteText: string } | null> {
    const existing = await prisma.invoice.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) return null;

    const charges = toInvoiceCharges(existing.charges);
    const adjusted: InvoiceCharges = { ...charges, otherCharges: charges.otherCharges + amount };
    const noteText = note;

    const row = await prisma.$transaction(async (tx) => {
      await tx.invoiceCharge.upsert({
        where: { invoiceId: id },
        create: { invoiceId: id, ...chargesToDb(adjusted) },
        update: { otherCharges: new Prisma.Decimal(adjusted.otherCharges) },
      });
      await tx.invoice.update({
        where: { id },
        data: {
          totalBill: new Prisma.Decimal(calculateTotalBill(adjusted)),
          adjustmentNote: noteText,
        },
      });
      return tx.invoice.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    });

    return { invoice: toInvoice(row), noteText };
  },

  /** Rolls a completed trip's distance into an existing draft invoice. */
  async addTripToDraft(
    invoiceId: string,
    distanceKm: number,
    kmRate: number
  ): Promise<Invoice | null> {
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: INCLUDE,
    });
    if (!existing) return null;

    const charges = toInvoiceCharges(existing.charges);
    const updatedCharges: InvoiceCharges = {
      ...charges,
      distanceKm: charges.distanceKm + distanceKm,
      kmRate,
    };
    updatedCharges.distanceCharge = Math.round(updatedCharges.distanceKm * kmRate);

    const row = await prisma.$transaction(async (tx) => {
      await tx.invoiceCharge.update({
        where: { invoiceId },
        data: {
          distanceKm: new Prisma.Decimal(updatedCharges.distanceKm),
          kmRate: new Prisma.Decimal(updatedCharges.kmRate),
          distanceCharge: new Prisma.Decimal(updatedCharges.distanceCharge),
        },
      });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          tripCount: { increment: 1 },
          totalBill: new Prisma.Decimal(calculateTotalBill(updatedCharges)),
        },
      });
      return tx.invoice.findUniqueOrThrow({ where: { id: invoiceId }, include: INCLUDE });
    });

    return toInvoice(row);
  },

  /** Creates the first draft invoice of a billing month for a vehicle. */
  async createDraft(input: {
    vehicleNumber: string;
    vehicleCategory: string;
    partner: string;
    billingMonth: string;
    charges: InvoiceCharges;
  }): Promise<Invoice> {
    const row = await prisma.$transaction(async (tx) => {
      const { id, seq } = await allocateInvoiceId(tx, input.billingMonth);
      return tx.invoice.create({
        data: {
          id,
          seq,
          invoiceNumber: id,
          vehicleId: await resolveVehicleId(tx, input.vehicleNumber),
          vehicleNumber: input.vehicleNumber,
          vehicleCategory: input.vehicleCategory,
          partner: input.partner,
          billingMonth: input.billingMonth,
          tripCount: 1,
          totalBill: new Prisma.Decimal(calculateTotalBill(input.charges)),
          status: "Draft",
          generatedDate: new Date().toISOString(),
          approvedBy: null,
          approvedDate: null,
          charges: { create: chargesToDb(input.charges) },
        },
        include: INCLUDE,
      });
    });
    return toInvoice(row);
  },
};
