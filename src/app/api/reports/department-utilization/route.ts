import { NextRequest, NextResponse } from "next/server";
import { buildSimpleReportWorkbook, reportFileName, ReportExcelColumn } from "@/lib/reportExcel";
import { buildDepartmentUtilizationRows } from "@/lib/utilizationReport";
import { errorResponse } from "@/server/errors";
import { assertExportType, parseDateRange, parseIdList, xlsxResponse } from "@/server/reports";
import { requisitionRepository } from "@/server/repositories/requisitions";

export const runtime = "nodejs";

const REPORT_TITLE = "Department-wise Vehicle Utilization Report";
const FILE_NAME_PREFIX = "Department-Utilization-Report";

const EXCEL_COLUMNS: ReportExcelColumn[] = [
  { field: "department", headerName: "Department" },
  { field: "trips", headerName: "Trip Count" },
  { field: "vehicleCount", headerName: "Vehicles Used" },
  { field: "distanceKm", headerName: "Total Distance (KM)" },
];

/**
 * Generates the department-wise utilization report server-side. Computed from
 * trips alone, so the date range may span any number of months.
 *
 * Query params:
 *   `from`, `to`    YYYY-MM-DD, required
 *   `departments`   comma-separated department names; omit for all departments
 *   `export_type`   `excel` to download an .xlsx instead of JSON rows
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const range = parseDateRange(params.get("from"), params.get("to"));
    const exportType = params.get("export_type");
    assertExportType(exportType, ["excel"]);

    const requested = parseIdList(params.get("departments"));
    const trips = await requisitionRepository.listTripsInRange(range.from, range.toExclusive);

    // No explicit selection means every department with a trip in the range.
    const departments =
      requested.length > 0 ? requested : Array.from(new Set(trips.map((t) => t.department)));
    const rows = buildDepartmentUtilizationRows(trips, departments);

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
    return errorResponse(error, "Failed to generate the department utilization report.");
  }
}
