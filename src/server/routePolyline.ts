import { promises as fs } from "fs";
import path from "path";
import { GeoPoint } from "@/types";

const POLYLINE_DIR = path.join(process.cwd(), "data", "trip-route-polylines");

function fileFor(requisitionId: string): string {
  return path.join(POLYLINE_DIR, `${requisitionId}.json`);
}

export async function readRoutePolyline(requisitionId: string): Promise<GeoPoint[] | undefined> {
  try {
    const raw = await fs.readFile(fileFor(requisitionId), "utf-8");
    return JSON.parse(raw) as GeoPoint[];
  } catch {
    return undefined;
  }
}

export async function readRoutePolylines(requisitionIds: string[]): Promise<Map<string, GeoPoint[]>> {
  const entries = await Promise.all(
    requisitionIds.map(async (id) => [id, await readRoutePolyline(id)] as const)
  );
  const map = new Map<string, GeoPoint[]>();
  for (const [id, polyline] of entries) {
    if (polyline) map.set(id, polyline);
  }
  return map;
}

export async function writeRoutePolyline(requisitionId: string, polyline: GeoPoint[] | undefined): Promise<void> {
  const file = fileFor(requisitionId);
  if (!polyline || polyline.length === 0) {
    await fs.rm(file, { force: true });
    return;
  }
  await fs.mkdir(POLYLINE_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(polyline, null, 2) + "\n", "utf-8");
}

export async function deleteRoutePolyline(requisitionId: string): Promise<void> {
  await fs.rm(fileFor(requisitionId), { force: true });
}
