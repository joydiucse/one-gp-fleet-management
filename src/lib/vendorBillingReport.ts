import type { Invoice, Vehicle } from "@/types";
import { buildVehicleBillingRows, VehicleBillingRow } from "./vehicleBillingReport";

/**
 * Vendor-wise billing report rows.
 *
 * Same charge breakdown as the vehicle billing report, aggregated one row per
 * vendor. Vendor is captured per trip requisition (Requisition.vendor), not on
 * the invoice, so the trips in the selected date range decide which vehicles
 * roll up under which vendor; the charges themselves come from those vehicles'
 * invoices for the billing month.
 *
 * Note the range only narrows *which vehicles* a vendor is credited with. The
 * invoice a vehicle contributes is a whole-month document, so a range covering
 * part of a month still contributes that month's full charges. The API keeps
 * the range inside a single calendar month so the month is never ambiguous.
 *
 * The trip input is a minimal shape rather than the full `Requisition` type so
 * the API route can feed it from a narrow `select`.
 */

export interface VendorBillingTrip {
  vendor?: string | null;
  vehicleNumber?: string | null;
  requestDateTime: string;
}

export interface VendorBillingRow {
  id: string;
  vendor: string;
  vehicleCount: number;
  tripCount: number;
  usageFrom: string;
  usageTo: string;
  fuelConsRate: number;
  totalKmRun: number;
  kmOctane: number;
  kmLPG: number;
  kmCNG: number;
  kmHybrid: number;
  rateOctane: number;
  rateLPG: number;
  rateCNG: number;
  rateHybrid: number;
  costOctane: number;
  costLPG: number;
  costCNG: number;
  costHybrid: number;
  totalKmCost: number;
  startupFuelCost: number;
  driverDaDays: number;
  driverDaAmount: number;
  tollCharge: number;
  parkingCharge: number;
  rentAmount: number;
  extraServiceRate: number;
  extraServiceHour: number;
  extraServiceAmount: number;
  mobileBill: number;
  adjustmentAbsent: number;
  iftarBillRate: number;
  iftarBillDays: number;
  iftarBillAmount: number;
  totalAmount: number;
  vatAmount: number;
  grandTotal: number;
}

/** The distinct vendors appearing on trips, sorted for the filter dropdown. */
export function listVendors(trips: VendorBillingTrip[]): string[] {
  return Array.from(new Set(trips.map((t) => t.vendor).filter((v): v is string => !!v))).sort();
}

/** The columns that are plain sums of the vendor's vehicle rows. */
const SUMMED_FIELDS = [
  "totalKmRun",
  "kmOctane",
  "kmLPG",
  "kmCNG",
  "kmHybrid",
  "costOctane",
  "costLPG",
  "costCNG",
  "costHybrid",
  "totalKmCost",
  "startupFuelCost",
  "driverDaDays",
  "driverDaAmount",
  "tollCharge",
  "parkingCharge",
  "rentAmount",
  "extraServiceHour",
  "extraServiceAmount",
  "mobileBill",
  "adjustmentAbsent",
  "iftarBillDays",
  "iftarBillAmount",
  "totalAmount",
  "vatAmount",
  "grandTotal",
] as const;

type SummedField = (typeof SUMMED_FIELDS)[number];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * A vendor-level rate, derived so that rate x quantity still equals the summed
 * amount. Averaging the vehicles' own rates would not hold that identity.
 */
function derivedRate(amount: number, quantity: number): number {
  return quantity === 0 ? 0 : round2(amount / quantity);
}

export function buildVendorBillingRows(
  trips: VendorBillingTrip[],
  vehicles: Vehicle[],
  invoices: Invoice[],
  vendors: string[],
  billingMonth: string,
  range: { from: string; to: string }
): VendorBillingRow[] {
  // Trips in range, grouped into the vehicles and trip count of each vendor.
  const byVendor = new Map<string, { vehicleNumbers: Set<string>; trips: number }>();
  for (const trip of trips) {
    const vendor = trip.vendor;
    if (!vendor || !vendors.includes(vendor)) continue;
    const tripDate = trip.requestDateTime.slice(0, 10);
    if (tripDate < range.from || tripDate > range.to) continue;
    const entry = byVendor.get(vendor) ?? { vehicleNumbers: new Set<string>(), trips: 0 };
    entry.trips += 1;
    if (trip.vehicleNumber) entry.vehicleNumbers.add(trip.vehicleNumber);
    byVendor.set(vendor, entry);
  }

  // The per-vehicle breakdown is exactly the vehicle billing report's, so the
  // two reports can never disagree on a vehicle's charges.
  const vehicleRows = buildVehicleBillingRows(
    invoices,
    vehicles,
    vehicles.map((v) => v.id),
    billingMonth
  );
  const rowByVehicleNumber = new Map<string, VehicleBillingRow>(
    vehicleRows.map((row) => [row.vehicleNumber, row])
  );

  return Array.from(byVendor.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([vendor, entry]) => {
      const rows = Array.from(entry.vehicleNumbers)
        .map((vehicleNumber) => rowByVehicleNumber.get(vehicleNumber))
        .filter((row): row is VehicleBillingRow => row !== undefined);

      const sums = {} as Record<SummedField, number>;
      for (const field of SUMMED_FIELDS) {
        sums[field] = round2(rows.reduce((total, row) => total + row[field], 0));
      }

      const fuelRates = rows.map((r) => r.fuelConsRate).filter((rate) => rate > 0);

      return {
        id: vendor,
        vendor,
        vehicleCount: entry.vehicleNumbers.size,
        tripCount: entry.trips,
        usageFrom: range.from,
        usageTo: range.to,
        fuelConsRate:
          fuelRates.length === 0
            ? 0
            : round2(fuelRates.reduce((a, b) => a + b, 0) / fuelRates.length),
        ...sums,
        rateOctane: derivedRate(sums.costOctane, sums.kmOctane),
        rateLPG: derivedRate(sums.costLPG, sums.kmLPG),
        rateCNG: derivedRate(sums.costCNG, sums.kmCNG),
        rateHybrid: derivedRate(sums.costHybrid, sums.kmHybrid),
        extraServiceRate: derivedRate(sums.extraServiceAmount, sums.extraServiceHour),
        iftarBillRate: derivedRate(sums.iftarBillAmount, sums.iftarBillDays),
      };
    });
}
