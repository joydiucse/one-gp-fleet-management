import { Prisma } from "@prisma/client";
import { GeoPoint } from "@/types";
import { prisma } from "./db";

// Route geometry used to live in data/trip-route-polylines/<requisition>.json.
// It is now a child table keyed by requisition, so a trip and its route are
// written in one transaction and deleted together.

function toPoints(rows: { lat: Prisma.Decimal; lng: Prisma.Decimal }[]): GeoPoint[] {
  return rows.map((row) => ({ lat: Number(row.lat), lng: Number(row.lng) }));
}

export async function readRoutePolyline(requisitionId: string): Promise<GeoPoint[] | undefined> {
  const rows = await prisma.requisitionRoutePoint.findMany({
    where: { requisitionId },
    orderBy: { seq: "asc" },
    select: { lat: true, lng: true },
  });
  return rows.length > 0 ? toPoints(rows) : undefined;
}

/**
 * Loads the route for many requisitions in one query, so listing trips does not
 * fan out into one read per trip.
 */
export async function readRoutePolylines(
  requisitionIds: string[]
): Promise<Map<string, GeoPoint[]>> {
  const map = new Map<string, GeoPoint[]>();
  if (requisitionIds.length === 0) return map;

  const rows = await prisma.requisitionRoutePoint.findMany({
    where: { requisitionId: { in: requisitionIds } },
    orderBy: [{ requisitionId: "asc" }, { seq: "asc" }],
    select: { requisitionId: true, lat: true, lng: true },
  });

  for (const row of rows) {
    const existing = map.get(row.requisitionId);
    const point = { lat: Number(row.lat), lng: Number(row.lng) };
    if (existing) existing.push(point);
    else map.set(row.requisitionId, [point]);
  }
  return map;
}

export async function writeRoutePolyline(
  requisitionId: string,
  polyline: GeoPoint[] | undefined
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.requisitionRoutePoint.deleteMany({ where: { requisitionId } });
    if (!polyline || polyline.length === 0) return;
    await tx.requisitionRoutePoint.createMany({
      data: polyline.map((point, index) => ({
        requisitionId,
        seq: index,
        lat: new Prisma.Decimal(point.lat),
        lng: new Prisma.Decimal(point.lng),
      })),
    });
  });
}

export async function deleteRoutePolyline(requisitionId: string): Promise<void> {
  await prisma.requisitionRoutePoint.deleteMany({ where: { requisitionId } });
}
