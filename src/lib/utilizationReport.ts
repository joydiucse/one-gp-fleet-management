/**
 * Department- and driver-wise utilization report rows.
 *
 * Both are computed from trip requisitions alone — no invoice figures — so the
 * date filter may span any range.
 *
 * The trip input is a minimal shape rather than the full `Requisition` type so
 * the API routes can feed it from a narrow `select`.
 */

export interface ReportTrip {
  vendor?: string | null;
  department: string;
  driverName?: string | null;
  vehicleNumber?: string | null;
  totalDistanceKm?: number | null;
  requestDateTime: string;
}

/** Trips with no driver assigned are grouped under this label. */
export const UNASSIGNED_DRIVER = "Unassigned";

export interface DepartmentUtilizationRow {
  id: string;
  department: string;
  trips: number;
  vehicleCount: number;
  distanceKm: number;
}

export interface DriverUtilizationRow {
  id: string;
  driver: string;
  trips: number;
  distanceKm: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function driverOf(trip: ReportTrip): string {
  return trip.driverName ?? UNASSIGNED_DRIVER;
}

export function buildDepartmentUtilizationRows(
  trips: ReportTrip[],
  departments: string[]
): DepartmentUtilizationRow[] {
  const byDepartment = new Map<
    string,
    { trips: number; vehicles: Set<string>; distanceKm: number }
  >();

  for (const trip of trips) {
    if (!departments.includes(trip.department)) continue;
    const entry =
      byDepartment.get(trip.department) ?? { trips: 0, vehicles: new Set<string>(), distanceKm: 0 };
    entry.trips += 1;
    if (trip.vehicleNumber) entry.vehicles.add(trip.vehicleNumber);
    entry.distanceKm += trip.totalDistanceKm ?? 0;
    byDepartment.set(trip.department, entry);
  }

  return Array.from(byDepartment.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([department, entry]) => ({
      id: department,
      department,
      trips: entry.trips,
      vehicleCount: entry.vehicles.size,
      distanceKm: round1(entry.distanceKm),
    }));
}

export function buildDriverUtilizationRows(
  trips: ReportTrip[],
  drivers: string[]
): DriverUtilizationRow[] {
  const byDriver = new Map<string, { trips: number; distanceKm: number }>();

  for (const trip of trips) {
    const driver = driverOf(trip);
    if (!drivers.includes(driver)) continue;
    const entry = byDriver.get(driver) ?? { trips: 0, distanceKm: 0 };
    entry.trips += 1;
    entry.distanceKm += trip.totalDistanceKm ?? 0;
    byDriver.set(driver, entry);
  }

  return Array.from(byDriver.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([driver, entry]) => ({
      id: driver,
      driver,
      trips: entry.trips,
      distanceKm: round1(entry.distanceKm),
    }));
}
