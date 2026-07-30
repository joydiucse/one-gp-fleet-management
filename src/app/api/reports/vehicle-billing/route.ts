import { NextRequest, NextResponse } from "next/server";
import { buildVehicleBillingRows } from "@/lib/vehicleBillingReport";
import { buildVehicleBillingWorkbook, vehicleBillingFileName } from "@/lib/vehicleBillingExcel";
import { errorResponse } from "@/server/errors";
import { assertExportType, monthLabelOf, parseIdList, xlsxResponse } from "@/server/reports";
import { invoiceRepository } from "@/server/repositories/invoices";
import { vehicleRepository } from "@/server/repositories/vehicles";

export const runtime = "nodejs";

/**
 * Generates the vehicle billing report server-side.
 *
 * Query params:
 *   `billingMonth`  YYYY-MM (required)
 *   `vehicleIds`    comma-separated vehicle ids; omit for all vehicles
 *   `export_type`   `excel` to download an .xlsx instead of JSON rows
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const billingMonth = params.get("billingMonth") ?? "";
    const monthLabel = monthLabelOf(billingMonth);
    const exportType = params.get("export_type");
    assertExportType(exportType, ["excel"]);

    const requestedIds = parseIdList(params.get("vehicleIds"));

    const [vehicles, invoices] = await Promise.all([
      vehicleRepository.list(),
      invoiceRepository.listForBillingMonth(billingMonth),
    ]);

    // No explicit selection means every vehicle.
    const vehicleIds = requestedIds.length > 0 ? requestedIds : vehicles.map((v) => v.id);
    const rows = buildVehicleBillingRows(invoices, vehicles, vehicleIds, billingMonth);

    if (exportType === "excel") {
      const workbook = await buildVehicleBillingWorkbook(rows, monthLabel);
      return xlsxResponse(workbook, vehicleBillingFileName(monthLabel));
    }

    return NextResponse.json({ billingMonth, monthLabel, rows });
  } catch (error) {
    return errorResponse(error, "Failed to generate the vehicle billing report.");
  }
}
