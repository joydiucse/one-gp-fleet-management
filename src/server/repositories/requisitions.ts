import { Prisma } from "@prisma/client";
import type { GeoPoint, Requisition, TimeExtension, TripStatus } from "@/types";
import { type ReportTrip, UNASSIGNED_DRIVER } from "@/lib/utilizationReport";
import { prisma } from "../db";
import { allocateId } from "../ids";
import { DomainError } from "../errors";
import { toRequisition, tripStatusToDb } from "../mappers";
import { asOptionalNumber, asOptionalString, asString, asBoolean } from "./types";

const INCLUDE = {
  timeExtensions: { orderBy: { seq: "asc" } },
  routePoints: { orderBy: { seq: "asc" }, select: { lat: true, lng: true } },
} as const;

const TRIP_STATUSES: TripStatus[] = [
  "In Progress",
  "Started",
  "Completed",
  "Cancelled",
  "Rejected",
];

function asTripStatus(value: unknown, fallback: TripStatus = "In Progress"): TripStatus {
  const text = asString(value, fallback);
  return (TRIP_STATUSES as string[]).includes(text) ? (text as TripStatus) : fallback;
}

function asGeoPoint(value: unknown): GeoPoint | null {
  if (typeof value !== "object" || value === null) return null;
  const point = value as { lat?: unknown; lng?: unknown };
  const lat = asOptionalNumber(point.lat);
  const lng = asOptionalNumber(point.lng);
  if (lat === null || lng === null) return null;
  return { lat, lng };
}

function asPolyline(value: unknown): GeoPoint[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const points = value.map(asGeoPoint).filter((p): p is GeoPoint => p !== null);
  return points;
}

function asTimeExtensions(value: unknown): TimeExtension[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const e = entry as Record<string, unknown>;
    const newEndTime = asOptionalString(e.newEndTime);
    if (!newEndTime) return [];
    return [
      {
        extendedAt: asString(e.extendedAt, new Date().toISOString()),
        previousEndTime: asOptionalString(e.previousEndTime),
        newEndTime,
        note: asString(e.note),
        extendedBy: asString(e.extendedBy, "System"),
      },
    ];
  });
}

function decimalOrNull(value: number | null): Prisma.Decimal | null {
  return value === null ? null : new Prisma.Decimal(value);
}

/**
 * Trips keep the vehicle number and driver name they ran with even when that
 * master record is later removed, so the foreign key is resolved from the
 * snapshot on a best-effort basis and left null when there is no match.
 */
async function resolveVehicleId(
  client: Prisma.TransactionClient,
  vehicleNumber: string | null
): Promise<string | null> {
  if (!vehicleNumber) return null;
  const row = await client.vehicle.findUnique({
    where: { vehicleNumber },
    select: { id: true },
  });
  return row?.id ?? null;
}

async function resolveDriverId(
  client: Prisma.TransactionClient,
  driverName: string | null
): Promise<string | null> {
  if (!driverName) return null;
  const row = await client.driver.findFirst({
    where: { name: driverName },
    select: { id: true },
    orderBy: { seq: "asc" },
  });
  return row?.id ?? null;
}

/** Replaces a requisition's stored route geometry. */
async function replaceRoutePoints(
  client: Prisma.TransactionClient,
  requisitionId: string,
  polyline: GeoPoint[] | undefined
): Promise<void> {
  await client.requisitionRoutePoint.deleteMany({ where: { requisitionId } });
  if (!polyline || polyline.length === 0) return;
  await client.requisitionRoutePoint.createMany({
    data: polyline.map((point, index) => ({
      requisitionId,
      seq: index,
      lat: new Prisma.Decimal(point.lat),
      lng: new Prisma.Decimal(point.lng),
    })),
  });
}

/** Replaces a requisition's time-extension history. */
async function replaceTimeExtensions(
  client: Prisma.TransactionClient,
  requisitionId: string,
  extensions: TimeExtension[] | undefined
): Promise<void> {
  await client.requisitionTimeExtension.deleteMany({ where: { requisitionId } });
  if (!extensions || extensions.length === 0) return;
  await client.requisitionTimeExtension.createMany({
    data: extensions.map((entry, index) => ({
      requisitionId,
      seq: index,
      extendedAt: entry.extendedAt,
      previousEndTime: entry.previousEndTime,
      newEndTime: entry.newEndTime,
      note: entry.note,
      extendedBy: entry.extendedBy,
    })),
  });
}

/** Maps the `flags` object onto its five boolean columns. */
function flagColumns(value: unknown) {
  const flags = (typeof value === "object" && value !== null ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    flagMissingStartEndTime: asBoolean(flags.missingStartEndTime),
    flagMissingDistance: asBoolean(flags.missingDistance),
    flagVehicleDriverMismatch: asBoolean(flags.vehicleDriverMismatch),
    flagDuplicateTicketId: asBoolean(flags.duplicateTicketId),
    flagGpsDataMissing: asBoolean(flags.gpsDataMissing),
  };
}

export const requisitionRepository = {
  async list(): Promise<Requisition[]> {
    const rows = await prisma.requisition.findMany({ include: INCLUDE, orderBy: { seq: "asc" } });
    return rows.map(toRequisition);
  },

  async find(id: string): Promise<Requisition | null> {
    const row = await prisma.requisition.findUnique({ where: { id }, include: INCLUDE });
    return row ? toRequisition(row) : null;
  },

  /** The distinct vendors that appear on trips, for report filter dropdowns. */
  async listVendorNames(): Promise<string[]> {
    const rows = await prisma.requisition.findMany({
      where: { vendor: { not: null } },
      select: { vendor: true },
      distinct: ["vendor"],
      orderBy: { vendor: "asc" },
    });
    return rows.map((r) => r.vendor).filter((v): v is string => !!v);
  },

  /** The distinct requesting departments, for report filter dropdowns. */
  async listDepartmentNames(): Promise<string[]> {
    const rows = await prisma.requisition.findMany({
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    });
    return rows.map((r) => r.department);
  },

  /**
   * The distinct drivers that appear on trips, for report filter dropdowns.
   * Trips with no driver assigned contribute the "Unassigned" bucket the driver
   * utilization report groups them under.
   */
  async listDriverNames(): Promise<string[]> {
    const rows = await prisma.requisition.findMany({
      select: { driverName: true },
      distinct: ["driverName"],
      orderBy: { driverName: "asc" },
    });
    const names = rows.map((r) => r.driverName).filter((n): n is string => !!n);
    const hasUnassigned = rows.some((r) => !r.driverName);
    return hasUnassigned ? [...names, UNASSIGNED_DRIVER] : names;
  },

  /**
   * The grouping and distance columns of every trip requested between `from`
   * (inclusive) and `toExclusive` — the only fields the vendor billing and
   * utilization reports need, so route points and time extensions are left out
   * of the query.
   */
  async listTripsInRange(from: string, toExclusive: string): Promise<ReportTrip[]> {
    const rows = await prisma.requisition.findMany({
      where: { requestDateTime: { gte: from, lt: toExclusive } },
      select: {
        vendor: true,
        department: true,
        driverName: true,
        vehicleNumber: true,
        totalDistanceKm: true,
        requestDateTime: true,
      },
      orderBy: { seq: "asc" },
    });
    return rows.map((row) => ({
      vendor: row.vendor,
      department: row.department,
      driverName: row.driverName,
      vehicleNumber: row.vehicleNumber,
      totalDistanceKm: row.totalDistanceKm === null ? null : Number(row.totalDistanceKm),
      requestDateTime: row.requestDateTime,
    }));
  },

  async create(data: Record<string, unknown>): Promise<Requisition> {
    const employeeName = asString(data.employeeName).trim();
    const department = asString(data.department).trim();
    if (!employeeName || !department) {
      throw new DomainError("Employee and department are required.");
    }

    const polyline = asPolyline(data.routePolyline);
    const pickup = asGeoPoint(data.pickupCoords);
    const destination = asGeoPoint(data.destinationCoords);
    const vehicleNumber = asOptionalString(data.vehicleNumber);
    const driverName = asOptionalString(data.driverName);

    const row = await prisma.$transaction(async (tx) => {
      const { id, seq } = await allocateId(tx, "requisitions");
      await tx.requisition.create({
        data: {
          id,
          seq,
          ticketId: asString(data.ticketId, id),
          requestorId: asString(data.requestorId, "REQ-MANUAL"),
          employeeName,
          department,
          requestDateTime: asString(data.requestDateTime, new Date().toISOString()),
          pickupLocation: asString(data.pickupLocation),
          destination: asString(data.destination),
          pickupLat: decimalOrNull(pickup?.lat ?? null),
          pickupLng: decimalOrNull(pickup?.lng ?? null),
          destinationLat: decimalOrNull(destination?.lat ?? null),
          destinationLng: decimalOrNull(destination?.lng ?? null),
          vehicleId: await resolveVehicleId(tx, vehicleNumber),
          vehicleNumber,
          vehicleCategory: asOptionalString(data.vehicleCategory),
          driverId: await resolveDriverId(tx, driverName),
          driverName,
          vendor: asOptionalString(data.vendor),
          approxTripStartTime: asOptionalString(data.approxTripStartTime),
          approxTripEndTime: asOptionalString(data.approxTripEndTime),
          tripStartTime: asOptionalString(data.tripStartTime),
          tripEndTime: asOptionalString(data.tripEndTime),
          totalTravelTimeMinutes: asOptionalNumber(data.totalTravelTimeMinutes),
          totalDistanceKm: decimalOrNull(asOptionalNumber(data.totalDistanceKm)),
          tripStatus: tripStatusToDb(asTripStatus(data.tripStatus)),
          ...flagColumns(data.flags),
        },
      });

      await replaceRoutePoints(tx, id, polyline);
      await replaceTimeExtensions(tx, id, asTimeExtensions(data.timeExtensions));

      const created = await tx.requisition.findUniqueOrThrow({ where: { id }, include: INCLUDE });
      return created;
    });

    return toRequisition(row);
  },

  async update(id: string, data: Record<string, unknown>): Promise<Requisition | null> {
    const existing = await prisma.requisition.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return null;

    const row = await prisma.$transaction(async (tx) => {
      const update: Prisma.RequisitionUncheckedUpdateInput = {};

      if ("ticketId" in data) update.ticketId = asString(data.ticketId);
      if ("requestorId" in data) update.requestorId = asString(data.requestorId);
      if ("employeeName" in data) {
        const employeeName = asString(data.employeeName).trim();
        if (!employeeName) throw new DomainError("Employee name is required.");
        update.employeeName = employeeName;
      }
      if ("department" in data) {
        const department = asString(data.department).trim();
        if (!department) throw new DomainError("Department is required.");
        update.department = department;
      }
      if ("requestDateTime" in data) update.requestDateTime = asString(data.requestDateTime);
      if ("pickupLocation" in data) update.pickupLocation = asString(data.pickupLocation);
      if ("destination" in data) update.destination = asString(data.destination);

      if ("pickupCoords" in data) {
        const point = asGeoPoint(data.pickupCoords);
        update.pickupLat = decimalOrNull(point?.lat ?? null);
        update.pickupLng = decimalOrNull(point?.lng ?? null);
      }
      if ("destinationCoords" in data) {
        const point = asGeoPoint(data.destinationCoords);
        update.destinationLat = decimalOrNull(point?.lat ?? null);
        update.destinationLng = decimalOrNull(point?.lng ?? null);
      }

      if ("vehicleNumber" in data) {
        const vehicleNumber = asOptionalString(data.vehicleNumber);
        update.vehicleNumber = vehicleNumber;
        update.vehicleId = await resolveVehicleId(tx, vehicleNumber);
      }
      if ("vehicleCategory" in data) update.vehicleCategory = asOptionalString(data.vehicleCategory);
      if ("driverName" in data) {
        const driverName = asOptionalString(data.driverName);
        update.driverName = driverName;
        update.driverId = await resolveDriverId(tx, driverName);
      }
      if ("vendor" in data) update.vendor = asOptionalString(data.vendor);

      if ("approxTripStartTime" in data) {
        update.approxTripStartTime = asOptionalString(data.approxTripStartTime);
      }
      if ("approxTripEndTime" in data) {
        update.approxTripEndTime = asOptionalString(data.approxTripEndTime);
      }
      if ("tripStartTime" in data) update.tripStartTime = asOptionalString(data.tripStartTime);
      if ("tripEndTime" in data) update.tripEndTime = asOptionalString(data.tripEndTime);
      if ("totalTravelTimeMinutes" in data) {
        update.totalTravelTimeMinutes = asOptionalNumber(data.totalTravelTimeMinutes);
      }
      if ("totalDistanceKm" in data) {
        update.totalDistanceKm = decimalOrNull(asOptionalNumber(data.totalDistanceKm));
      }
      if ("tripStatus" in data) update.tripStatus = tripStatusToDb(asTripStatus(data.tripStatus));
      if ("flags" in data) Object.assign(update, flagColumns(data.flags));

      if (Object.keys(update).length > 0) {
        await tx.requisition.update({ where: { id }, data: update });
      }
      if ("routePolyline" in data) {
        await replaceRoutePoints(tx, id, asPolyline(data.routePolyline));
      }
      if ("timeExtensions" in data) {
        await replaceTimeExtensions(tx, id, asTimeExtensions(data.timeExtensions));
      }

      return tx.requisition.findUniqueOrThrow({ where: { id }, include: INCLUDE });
    });

    return toRequisition(row);
  },

  async remove(id: string): Promise<Requisition | null> {
    const existing = await prisma.requisition.findUnique({ where: { id }, include: INCLUDE });
    if (!existing) return null;
    // Route points and time extensions cascade with the requisition.
    await prisma.requisition.delete({ where: { id } });
    return toRequisition(existing);
  },

  /** Appends one entry to the extension history without rewriting the rest. */
  async appendTimeExtension(id: string, entry: TimeExtension): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const last = await tx.requisitionTimeExtension.findFirst({
        where: { requisitionId: id },
        orderBy: { seq: "desc" },
        select: { seq: true },
      });
      await tx.requisitionTimeExtension.create({
        data: {
          requisitionId: id,
          seq: (last?.seq ?? -1) + 1,
          extendedAt: entry.extendedAt,
          previousEndTime: entry.previousEndTime,
          newEndTime: entry.newEndTime,
          note: entry.note,
          extendedBy: entry.extendedBy,
        },
      });
    });
  },
};
