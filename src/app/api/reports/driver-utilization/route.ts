import { NextRequest, NextResponse } from "next/server";
import { buildSimpleReportWorkbook, reportFileName, ReportExcelColumn } from "@/lib/reportExcel";
import { buildDriverUtilizationRows, driverOf } from "@/lib/utilizationReport";
import { errorResponse } from "@/server/errors";
import { assertExportType, parseDateRange, parseIdList, xlsxResponse } from "@/server/reports";
import { requisitionRepository } from "@/server/repositories/requisitions";

export const runtime = "nodejs";

const REPORT_TITLE = "Driver Utilization Report";
const FILE_NAME_PREFIX = "Driver-Utilization-Report";

const EXCEL_COLUMNS: ReportExcelColumn[] = [
  { field: "driver", headerName: "Driver Name" },
  { field: "trips", headerName: "Trip Count" },
  { field: "distanceKm", headerName: "Total Distance (KM)" },
];

/**
 * Generates the driver utilization report server-side. Computed from trips
 * alone, so the date range may span any number of months.
 *
 * Query params:
 *   `from`, `to`    YYYY-MM-DD, required
 *   `drivers`       comma-separated driver names; omit for all drivers
 *   `export_type`   `excel` to download an .xlsx instead of JSON rows
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const range = parseDateRange(params.get("from"), params.get("to"));
    const exportType = params.get("export_type");
    assertExportType(exportType, ["excel"]);

    const requested = parseIdList(params.get("drivers"));
    const trips = await requisitionRepository.listTripsInRange(range.from, range.toExclusive);

    // No explicit selection means every driver with a trip in the range.
    const drivers = requested.length > 0 ? requested : Array.from(new Set(trips.map(driverOf)));
    const rows = buildDriverUtilizationRows(trips, drivers);

    if (exportType === "excel") {
      const workbook = await buildSimpleReportWorkbook(
        rows as unknown as Record<string, unknown>[],
        EXCEL_COLUMNS,
        REPORT_TITLE,
        range.rangeLabel
      );
      return xlsxResponse(workbook, reportFileName(FILE_NAME_PREFIX, range.rangeLabel));
    }

    return NextResponse.json({ from: range.from, to: range.to, rangeLabel: range.rangeLabel, rows });
  } catch (error) {
    return errorResponse(error, "Failed to generate the driver utilization report.");
  }
}
