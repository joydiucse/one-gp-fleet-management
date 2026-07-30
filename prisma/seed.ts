/**
 * Imports the JSON files under data/ into MySQL.
 *
 * Run with:  npm run db:seed
 *
 * Idempotent: it clears the tables it fills first, so it can be re-run to reset
 * the database back to the contents of data/. The JSON files are left untouched
 * and remain the source of the initial data set.
 *
 * Two things the source data forced the importer to handle:
 *   * Trips reference a vehicle and a driver that no longer exist in the master
 *     lists. The foreign key is left null and the name/number snapshot on the
 *     trip is kept, so billing history stays intact.
 *   * IDs skip numbers where records were deleted (vehicles reach V-016 with 15
 *     rows). Each sequence is set from the highest ID seen, not the row count.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";
import { appEnv, databaseUrl } from "../src/server/databaseUrl";

const DATA_DIR = path.join(process.cwd(), "data");
const POLYLINE_DIR = path.join(DATA_DIR, "trip-route-polylines");

// The import below clears the tables it fills, so refuse to run against the
// production database unless that is spelled out on the command line.
if (appEnv() === "prod" && !process.env.SEED_ALLOW_PROD) {
  throw new Error(
    "Refusing to seed with APP_ENV=prod: this clears the tables it fills. " +
      "Set SEED_ALLOW_PROD=1 as well if that is really what you want."
  );
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl()) });

// ------------------------------------------------------------------ helpers

async function readJson<T>(name: string): Promise<T[]> {
  const raw = await readFile(path.join(DATA_DIR, `${name}.json`), "utf-8");
  return JSON.parse(raw) as T[];
}

/** Highest trailing number across a set of business IDs. */
function maxSeq(rows: { id: string }[]): number {
  return rows.reduce((max, row) => {
    const match = /(\d+)$/.exec(row.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

/** Trailing number of one business ID. */
function seqOf(id: string, fallback: number): number {
  const match = /(\d+)$/.exec(id);
  return match ? Number(match[1]) : fallback;
}

function dec(value: unknown): Prisma.Decimal {
  return new Prisma.Decimal(typeof value === "number" ? value : Number(value ?? 0));
}

function decOrNull(value: unknown): Prisma.Decimal | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? new Prisma.Decimal(n) : null;
}

function strOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, "");
}

const TRIP_STATUS_TO_DB = {
  "In Progress": "IN_PROGRESS",
  Started: "Started",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Rejected: "Rejected",
} as const;

const INVOICE_STATUS_TO_DB = {
  Draft: "Draft",
  "Pending Approval": "PENDING_APPROVAL",
  Approved: "Approved",
  Paid: "Paid",
  Rejected: "Rejected",
} as const;

// ------------------------------------------------------------------ source shapes

interface JsonNamed {
  id: string;
  name: string;
}
interface JsonVehicle {
  id: string;
  vehicleNumber: string;
  category: string;
  fuelType: string;
  seatCapacity: number;
  partner: string;
  monthlyFixedRent: number;
  perKmRate: number;
  otRate: number;
  personalUsageBill: number;
  tollCharge: number;
  parkingCharge: number;
  startupFuelCharge: number;
  mobileBill: number;
  otherCharge: number;
  status: "Active" | "Inactive" | "Maintenance";
  mobileNumber?: string;
  rentType?: "Monthly" | "Daily";
}
interface JsonDriver {
  id: string;
  name: string;
  mobile: string;
  licenseNumber: string;
  licenseAttachment: string;
  nidNumber: string;
  nidAttachment: string;
  vendor: string;
  status: "Active" | "Inactive" | "Suspended";
}
interface JsonRateCard {
  id: string;
  category: string;
  fuelType: string;
  monthlyFixedRent: number;
  perKmRate: number;
  otRatePerHour: number;
}
interface JsonRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  status: "Active" | "Inactive";
}
interface JsonUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  lastLogin: string;
  passwordHash: string;
}
interface JsonGeoPoint {
  lat: number;
  lng: number;
}
interface JsonRequisition {
  id: string;
  ticketId: string;
  requestorId: string;
  employeeName: string;
  department: string;
  requestDateTime: string;
  pickupLocation: string;
  destination: string;
  pickupCoords?: JsonGeoPoint;
  destinationCoords?: JsonGeoPoint;
  routePolyline?: JsonGeoPoint[];
  vehicleNumber?: string;
  vehicleCategory?: string;
  driverName?: string;
  vendor?: string;
  approxTripStartTime?: string | null;
  approxTripEndTime?: string | null;
  tripStartTime: string | null;
  tripEndTime: string | null;
  totalTravelTimeMinutes: number | null;
  totalDistanceKm: number | null;
  tripStatus: keyof typeof TRIP_STATUS_TO_DB;
  flags: Record<string, boolean>;
  timeExtensions?: {
    extendedAt: string;
    previousEndTime: string | null;
    newEndTime: string;
    note: string;
    extendedBy: string;
  }[];
}
interface JsonInvoice {
  id: string;
  invoiceNumber: string;
  vehicleNumber: string;
  vehicleCategory: string;
  partner: string;
  billingMonth: string;
  tripCount: number;
  charges: Record<string, number | string | undefined>;
  totalBill: number;
  status: keyof typeof INVOICE_STATUS_TO_DB;
  generatedDate: string;
  approvedBy: string | null;
  approvedDate: string | null;
  adjustmentNote?: string;
}
interface JsonAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}
interface JsonIntegrationLog {
  id: string;
  timestamp: string;
  direction: "Inbound" | "Outbound";
  payloadType: string;
  referenceId: string;
  status: "Success" | "Failed" | "Retried";
  message: string;
}

// ------------------------------------------------------------------ import

async function wipe(): Promise<void> {
  // Children before parents; the schema cascades most of these anyway.
  await prisma.requisitionRoutePoint.deleteMany();
  await prisma.requisitionTimeExtension.deleteMany();
  await prisma.requisition.deleteMany();
  await prisma.invoiceCharge.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicleCategory.deleteMany();
  await prisma.fuelType.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.idSequence.deleteMany();
}

async function main(): Promise<void> {
  console.log("Reading data/ …");
  const [
    categories,
    fuelTypes,
    vehicles,
    drivers,
    rateCards,
    roles,
    users,
    requisitions,
    invoices,
    auditLogs,
    integrationLogs,
  ] = await Promise.all([
    readJson<JsonNamed>("vehicleCategories"),
    readJson<JsonNamed>("fuelTypes"),
    readJson<JsonVehicle>("vehicles"),
    readJson<JsonDriver>("drivers"),
    readJson<JsonRateCard>("rateCards"),
    readJson<JsonRole>("roles"),
    readJson<JsonUser>("users"),
    readJson<JsonRequisition>("requisitions"),
    readJson<JsonInvoice>("invoices"),
    readJson<JsonAuditLog>("auditLogs"),
    readJson<JsonIntegrationLog>("integrationLogs"),
  ]);

  console.log("Clearing existing rows …");
  await wipe();

  // ---- master lists -------------------------------------------------------
  await prisma.vehicleCategory.createMany({
    data: categories.map((row, i) => ({
      id: row.id,
      seq: seqOf(row.id, i + 1),
      name: row.name,
    })),
  });
  await prisma.fuelType.createMany({
    data: fuelTypes.map((row, i) => ({ id: row.id, seq: seqOf(row.id, i + 1), name: row.name })),
  });

  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  const fuelTypeIdByName = new Map(fuelTypes.map((f) => [f.name, f.id]));

  function requireCategory(name: string, context: string): string {
    const id = categoryIdByName.get(name);
    if (!id) throw new Error(`${context}: unknown vehicle category '${name}'.`);
    return id;
  }
  function requireFuelType(name: string, context: string): string {
    const id = fuelTypeIdByName.get(name);
    if (!id) throw new Error(`${context}: unknown fuel type '${name}'.`);
    return id;
  }

  // ---- vehicles & drivers -------------------------------------------------
  await prisma.vehicle.createMany({
    data: vehicles.map((row, i) => ({
      id: row.id,
      seq: seqOf(row.id, i + 1),
      vehicleNumber: row.vehicleNumber,
      categoryId: requireCategory(row.category, `vehicle ${row.id}`),
      fuelTypeId: requireFuelType(row.fuelType, `vehicle ${row.id}`),
      seatCapacity: row.seatCapacity,
      partner: row.partner,
      mobileNumber: strOrNull(row.mobileNumber),
      monthlyFixedRent: dec(row.monthlyFixedRent),
      perKmRate: dec(row.perKmRate),
      otRate: dec(row.otRate),
      rentType: row.rentType ?? null,
      personalUsageBill: dec(row.personalUsageBill),
      tollCharge: dec(row.tollCharge),
      parkingCharge: dec(row.parkingCharge),
      startupFuelCharge: dec(row.startupFuelCharge),
      mobileBill: dec(row.mobileBill),
      otherCharge: dec(row.otherCharge),
      status: row.status,
    })),
  });

  await prisma.driver.createMany({
    data: drivers.map((row, i) => ({
      id: row.id,
      seq: seqOf(row.id, i + 1),
      name: row.name,
      mobile: row.mobile,
      mobileNormalized: normalizeMobile(row.mobile),
      licenseNumber: row.licenseNumber,
      licenseAttachment: row.licenseAttachment,
      nidNumber: row.nidNumber,
      nidAttachment: row.nidAttachment,
      vendor: row.vendor,
      status: row.status,
    })),
  });

  await prisma.rateCard.createMany({
    data: rateCards.map((row, i) => ({
      id: row.id,
      seq: seqOf(row.id, i + 1),
      categoryId: requireCategory(row.category, `rate card ${row.id}`),
      fuelTypeId: requireFuelType(row.fuelType, `rate card ${row.id}`),
      monthlyFixedRent: dec(row.monthlyFixedRent),
      perKmRate: dec(row.perKmRate),
      otRatePerHour: dec(row.otRatePerHour),
    })),
  });

  // ---- roles, permissions, users -----------------------------------------
  await prisma.role.createMany({
    data: roles.map((row, i) => ({
      id: row.id,
      seq: seqOf(row.id, i + 1),
      name: row.name,
      description: strOrNull(row.description),
      status: row.status,
    })),
  });
  // seq keeps the order the JSON listed them in.
  const rolePermissions = roles.flatMap((role) =>
    [...new Set(role.permissions)].map((permissionKey, seq) => ({
      roleId: role.id,
      permissionKey,
      seq,
    }))
  );
  if (rolePermissions.length > 0) {
    await prisma.rolePermission.createMany({ data: rolePermissions });
  }

  const roleIdByName = new Map(roles.map((r) => [r.name, r.id]));
  await prisma.user.createMany({
    data: users.map((row, i) => {
      const roleId = roleIdByName.get(row.role);
      if (!roleId) throw new Error(`user ${row.id}: unknown role '${row.role}'.`);
      return {
        id: row.id,
        seq: seqOf(row.id, i + 1),
        name: row.name,
        email: row.email,
        roleId,
        status: row.status,
        passwordHash: row.passwordHash,
        // "—" is the never-signed-in placeholder the grid renders.
        lastLogin: row.lastLogin === "—" ? null : strOrNull(row.lastLogin),
      };
    }),
  });

  // ---- requisitions -------------------------------------------------------
  const vehicleIdByNumber = new Map(vehicles.map((v) => [v.vehicleNumber, v.id]));
  const driverIdByName = new Map(drivers.map((d) => [d.name, d.id]));
  const danglingVehicles = new Set<string>();
  const danglingDrivers = new Set<string>();

  await prisma.requisition.createMany({
    data: requisitions.map((row, i) => {
      const vehicleId = row.vehicleNumber
        ? (vehicleIdByNumber.get(row.vehicleNumber) ?? null)
        : null;
      const driverId = row.driverName ? (driverIdByName.get(row.driverName) ?? null) : null;
      if (row.vehicleNumber && !vehicleId) danglingVehicles.add(row.vehicleNumber);
      if (row.driverName && !driverId) danglingDrivers.add(row.driverName);

      return {
        id: row.id,
        seq: seqOf(row.id, i + 1),
        ticketId: row.ticketId,
        requestorId: row.requestorId,
        employeeName: row.employeeName,
        department: row.department,
        requestDateTime: row.requestDateTime,
        pickupLocation: row.pickupLocation,
        destination: row.destination,
        pickupLat: decOrNull(row.pickupCoords?.lat),
        pickupLng: decOrNull(row.pickupCoords?.lng),
        destinationLat: decOrNull(row.destinationCoords?.lat),
        destinationLng: decOrNull(row.destinationCoords?.lng),
        vehicleId,
        vehicleNumber: strOrNull(row.vehicleNumber),
        vehicleCategory: strOrNull(row.vehicleCategory),
        driverId,
        driverName: strOrNull(row.driverName),
        vendor: strOrNull(row.vendor),
        approxTripStartTime: strOrNull(row.approxTripStartTime),
        approxTripEndTime: strOrNull(row.approxTripEndTime),
        tripStartTime: strOrNull(row.tripStartTime),
        tripEndTime: strOrNull(row.tripEndTime),
        totalTravelTimeMinutes: row.totalTravelTimeMinutes ?? null,
        totalDistanceKm: decOrNull(row.totalDistanceKm),
        tripStatus: TRIP_STATUS_TO_DB[row.tripStatus] ?? "IN_PROGRESS",
        flagMissingStartEndTime: Boolean(row.flags?.missingStartEndTime),
        flagMissingDistance: Boolean(row.flags?.missingDistance),
        flagVehicleDriverMismatch: Boolean(row.flags?.vehicleDriverMismatch),
        flagDuplicateTicketId: Boolean(row.flags?.duplicateTicketId),
        flagGpsDataMissing: Boolean(row.flags?.gpsDataMissing),
      };
    }),
  });

  const timeExtensions = requisitions.flatMap((row) =>
    (row.timeExtensions ?? []).map((entry, index) => ({
      requisitionId: row.id,
      seq: index,
      extendedAt: entry.extendedAt,
      previousEndTime: entry.previousEndTime,
      newEndTime: entry.newEndTime,
      note: entry.note,
      extendedBy: entry.extendedBy,
    }))
  );
  if (timeExtensions.length > 0) {
    await prisma.requisitionTimeExtension.createMany({ data: timeExtensions });
  }

  // ---- route geometry: sidecar files, then any inline polylines -----------
  const requisitionIds = new Set(requisitions.map((r) => r.id));
  let routePointCount = 0;
  let polylineFiles: string[] = [];
  try {
    polylineFiles = (await readdir(POLYLINE_DIR)).filter((f) => f.endsWith(".json"));
  } catch {
    // No sidecar directory: nothing to import.
  }

  const routePoints: { requisitionId: string; seq: number; lat: Prisma.Decimal; lng: Prisma.Decimal }[] =
    [];

  for (const file of polylineFiles) {
    const requisitionId = path.basename(file, ".json");
    if (!requisitionIds.has(requisitionId)) {
      console.warn(`  ! polyline ${file} has no matching requisition, skipped`);
      continue;
    }
    const raw = await readFile(path.join(POLYLINE_DIR, file), "utf-8");
    const points = JSON.parse(raw) as JsonGeoPoint[];
    points.forEach((point, index) => {
      routePoints.push({
        requisitionId,
        seq: index,
        lat: new Prisma.Decimal(point.lat),
        lng: new Prisma.Decimal(point.lng),
      });
    });
  }

  const fromFiles = new Set(routePoints.map((p) => p.requisitionId));
  for (const row of requisitions) {
    if (fromFiles.has(row.id) || !row.routePolyline?.length) continue;
    row.routePolyline.forEach((point, index) => {
      routePoints.push({
        requisitionId: row.id,
        seq: index,
        lat: new Prisma.Decimal(point.lat),
        lng: new Prisma.Decimal(point.lng),
      });
    });
  }

  // Chunked: a single createMany with thousands of rows can exceed the
  // driver's packet limit.
  for (let i = 0; i < routePoints.length; i += 1000) {
    const chunk = routePoints.slice(i, i + 1000);
    await prisma.requisitionRoutePoint.createMany({ data: chunk });
    routePointCount += chunk.length;
  }

  // ---- invoices -----------------------------------------------------------
  for (const [i, row] of invoices.entries()) {
    const charges = row.charges ?? {};
    const numberOrNull = (key: string) => decOrNull(charges[key]);
    await prisma.invoice.create({
      data: {
        id: row.id,
        seq: seqOf(row.id, i + 1),
        invoiceNumber: row.invoiceNumber,
        vehicleId: vehicleIdByNumber.get(row.vehicleNumber) ?? null,
        vehicleNumber: row.vehicleNumber,
        vehicleCategory: row.vehicleCategory,
        partner: row.partner,
        billingMonth: row.billingMonth,
        tripCount: row.tripCount,
        totalBill: dec(row.totalBill),
        status: INVOICE_STATUS_TO_DB[row.status] ?? "Draft",
        generatedDate: row.generatedDate,
        approvedBy: strOrNull(row.approvedBy),
        approvedDate: strOrNull(row.approvedDate),
        adjustmentNote: strOrNull(row.adjustmentNote),
        charges: {
          create: {
            fixedRent: dec(charges.fixedRent),
            personalUsageBill: dec(charges.personalUsageBill),
            distanceKm: dec(charges.distanceKm),
            kmRate: dec(charges.kmRate),
            distanceCharge: dec(charges.distanceCharge),
            otHours: dec(charges.otHours),
            otCharge: dec(charges.otCharge),
            tollCharge: dec(charges.tollCharge),
            parkingCharge: dec(charges.parkingCharge),
            startupFuelCharge: dec(charges.startupFuelCharge),
            mobileBill: dec(charges.mobileBill),
            otherCharges: dec(charges.otherCharges),
            usageFrom: strOrNull(charges.usageFrom),
            usageTo: strOrNull(charges.usageTo),
            kmOctane: numberOrNull("kmOctane"),
            kmLPG: numberOrNull("kmLPG"),
            kmCNG: numberOrNull("kmCNG"),
            kmHybrid: numberOrNull("kmHybrid"),
            rateOctane: numberOrNull("rateOctane"),
            rateLPG: numberOrNull("rateLPG"),
            rateCNG: numberOrNull("rateCNG"),
            rateHybrid: numberOrNull("rateHybrid"),
            driverDaDays: numberOrNull("driverDaDays"),
            driverDaAmount: numberOrNull("driverDaAmount"),
            extraServiceRate: numberOrNull("extraServiceRate"),
            extraServiceHour: numberOrNull("extraServiceHour"),
            extraServiceAmount: numberOrNull("extraServiceAmount"),
            adjustmentAbsent: numberOrNull("adjustmentAbsent"),
            iftarBillRate: numberOrNull("iftarBillRate"),
            iftarBillDays: numberOrNull("iftarBillDays"),
            iftarBillAmount: numberOrNull("iftarBillAmount"),
          },
        },
      },
    });
  }

  // ---- logs ---------------------------------------------------------------
  // The JSON file holds newest first; seq ascending preserves that ordering
  // when the audit page reads it back with seq descending.
  const auditAscending = [...auditLogs].reverse();
  for (let i = 0; i < auditAscending.length; i += 500) {
    await prisma.auditLog.createMany({
      data: auditAscending.slice(i, i + 500).map((row) => ({
        id: row.id,
        seq: seqOf(row.id, 0),
        timestamp: row.timestamp,
        user: row.user,
        action: row.action,
        module: row.module,
        details: row.details.slice(0, 1000),
      })),
    });
  }

  await prisma.integrationLog.createMany({
    data: integrationLogs.map((row, i) => ({
      id: row.id,
      seq: seqOf(row.id, i + 1),
      timestamp: row.timestamp,
      direction: row.direction,
      payloadType: row.payloadType,
      referenceId: row.referenceId,
      status: row.status,
      message: row.message,
    })),
  });

  // ---- id sequences -------------------------------------------------------
  // Next value = highest existing number + 1, so new records never collide
  // with an ID that was used and then deleted.
  const sequences: { name: string; nextValue: number }[] = [
    { name: "vehicleCategories", nextValue: maxSeq(categories) + 1 },
    { name: "fuelTypes", nextValue: maxSeq(fuelTypes) + 1 },
    { name: "vehicles", nextValue: maxSeq(vehicles) + 1 },
    { name: "drivers", nextValue: maxSeq(drivers) + 1 },
    { name: "rateCards", nextValue: maxSeq(rateCards) + 1 },
    { name: "roles", nextValue: maxSeq(roles) + 1 },
    { name: "users", nextValue: maxSeq(users) + 1 },
    { name: "requisitions", nextValue: maxSeq(requisitions) + 1 },
    { name: "invoices", nextValue: maxSeq(invoices) + 1 },
    { name: "auditLogs", nextValue: maxSeq(auditLogs) + 1 },
    { name: "integrationLogs", nextValue: maxSeq(integrationLogs) + 1 },
  ];
  await prisma.idSequence.createMany({ data: sequences });

  // ---- report -------------------------------------------------------------
  console.log("\nImported:");
  console.table({
    "vehicle categories": categories.length,
    "fuel types": fuelTypes.length,
    vehicles: vehicles.length,
    drivers: drivers.length,
    "rate cards": rateCards.length,
    roles: roles.length,
    "role permissions": rolePermissions.length,
    users: users.length,
    requisitions: requisitions.length,
    "time extensions": timeExtensions.length,
    "route points": routePointCount,
    invoices: invoices.length,
    "audit logs": auditLogs.length,
    "integration logs": integrationLogs.length,
  });

  if (danglingVehicles.size > 0) {
    console.warn(
      `Note: ${danglingVehicles.size} trip vehicle reference(s) have no master record; the number was kept and the link left empty: ${[...danglingVehicles].join(", ")}`
    );
  }
  if (danglingDrivers.size > 0) {
    console.warn(
      `Note: ${danglingDrivers.size} trip driver reference(s) have no master record; the name was kept and the link left empty: ${[...danglingDrivers].join(", ")}`
    );
  }

  console.log("\nNext IDs:", sequences.map((s) => `${s.name}=${s.nextValue}`).join("  "));
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error("\nImport failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
