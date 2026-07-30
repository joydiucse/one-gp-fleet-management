/**
 * Category- and fuel-type-wise cost analysis rows.
 *
 * Both consolidate invoice totals, so the caller works in whole billing months:
 * the API keeps the date filter inside one calendar month.
 *
 * The inputs are minimal shapes rather than the full `Invoice` / `Vehicle` types
 * so the API routes can feed them from narrow `select`s.
 */

export interface CostInvoice {
  vehicleNumber: string;
  vehicleCategory: string;
  totalBill: number;
}

export interface CostVehicleFuel {
  vehicleNumber: string;
  fuelType: string;
}

/** A vehicle whose fuel type is not on record is grouped under this label. */
export const UNKNOWN_FUEL_TYPE = "Unknown";

export interface CategoryCostRow {
  id: string;
  category: string;
  total: number;
}

export interface FuelCostRow {
  id: string;
  fuelType: string;
  total: number;
}

function sortedTotals(totals: Map<string, number>): [string, number][] {
  return Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function buildCategoryCostRows(
  invoices: CostInvoice[],
  categories: string[]
): CategoryCostRow[] {
  const totals = new Map<string, number>();
  for (const invoice of invoices) {
    if (!categories.includes(invoice.vehicleCategory)) continue;
    totals.set(
      invoice.vehicleCategory,
      (totals.get(invoice.vehicleCategory) ?? 0) + invoice.totalBill
    );
  }
  return sortedTotals(totals).map(([category, total]) => ({ id: category, category, total }));
}

export function buildFuelCostRows(
  invoices: CostInvoice[],
  vehicles: CostVehicleFuel[],
  fuelTypes: string[]
): FuelCostRow[] {
  // Fuel type lives on the vehicle, not the invoice, so it is joined on the
  // vehicle number the invoice was raised against.
  const fuelByVehicle = new Map(vehicles.map((v) => [v.vehicleNumber, v.fuelType]));

  const totals = new Map<string, number>();
  for (const invoice of invoices) {
    const fuelType = fuelByVehicle.get(invoice.vehicleNumber) ?? UNKNOWN_FUEL_TYPE;
    if (!fuelTypes.includes(fuelType)) continue;
    totals.set(fuelType, (totals.get(fuelType) ?? 0) + invoice.totalBill);
  }
  return sortedTotals(totals).map(([fuelType, total]) => ({ id: fuelType, fuelType, total }));
}
