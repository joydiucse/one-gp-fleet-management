import { NextRequest, NextResponse } from "next/server";
import { buildFuelCostRows, UNKNOWN_FUEL_TYPE } from "@/lib/costReport";
import { buildSimpleReportWorkbook, reportFileName, ReportExcelColumn } from "@/lib/reportExcel";
import { errorResponse } from "@/server/errors";
import { assertExportType, parseDateRange, parseIdList, xlsxResponse } from "@/server/reports";
import { invoiceRepository } from "@/server/repositories/invoices";
import { vehicleRepository } from "@/server/repositories/vehicles";

export const runtime = "nodejs";

const REPORT_TITLE = "Fuel Type-wise Cost Analysis";
const FILE_NAME_PREFIX = "Fuel-Cost-Report";

const EXCEL_COLUMNS: ReportExcelColumn[] = [
  { field: "fuelType", headerName: "Fuel Type" },
  { field: "total", headerName: "Total Cost" },
];

/**
 * Generates the fuel type-wise cost analysis server-side.
 *
 * Query params:
 *   `from`, `to`    YYYY-MM-DD, required, within one calendar month
 *   `fuelTypes`     comma-separated fuel type names; omit for all fuel types
 *   `export_type`   `excel` to download an .xlsx instead of JSON rows
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const range = parseDateRange(params.get("from"), params.get("to"), { singleMonth: true });
    const exportType = params.get("export_type");
    assertExportType(exportType, ["excel"]);

    const requested = parseIdList(params.get("fuelTypes"));

    const [invoices, vehicleFuels] = await Promise.all([
      invoiceRepository.listForBillingMonth(range.billingMonth),
      vehicleRepository.listVehicleFuelTypes(),
    ]);

    // No explicit selection means every fuel type in the fleet, plus the bucket
    // for invoices whose vehicle is no longer on record.
    const fuelTypes =
      requested.length > 0
        ? requested
        : [...new Set(vehicleFuels.map((v) => v.fuelType)), UNKNOWN_FUEL_TYPE];
    const rows = buildFuelCostRows(invoices, vehicleFuels, fuelTypes);

    if (exportType === "excel") {
      const workbook = await buildSimpleReportWorkbook(
        rows as unknown as Record<string, unknown>[],
        EXCEL_COLUMNS,
        REPORT_TITLE,
        range.rangeLabel
      );
      return xlsxResponse(workbook, reportFileName(FILE_NAME_PREFIX, range.rangeLabel));
    }

    return NextResponse.json({
      from: range.from,
      to: range.to,
      billingMonth: range.billingMonth,
      rangeLabel: range.rangeLabel,
      rows,
    });
  } catch (error) {
    return errorResponse(error, "Failed to generate the fuel cost report.");
  }
}
