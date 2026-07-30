import { NextRequest, NextResponse } from "next/server";
import { buildCategoryCostRows } from "@/lib/costReport";
import { buildSimpleReportWorkbook, reportFileName, ReportExcelColumn } from "@/lib/reportExcel";
import { errorResponse } from "@/server/errors";
import { assertExportType, parseDateRange, parseIdList, xlsxResponse } from "@/server/reports";
import { invoiceRepository } from "@/server/repositories/invoices";

export const runtime = "nodejs";

const REPORT_TITLE = "Vehicle Category-wise Cost Analysis";
const FILE_NAME_PREFIX = "Category-Cost-Report";

const EXCEL_COLUMNS: ReportExcelColumn[] = [
  { field: "category", headerName: "Vehicle Category" },
  { field: "total", headerName: "Total Cost" },
];

/**
 * Generates the vehicle category-wise cost analysis server-side.
 *
 * Query params:
 *   `from`, `to`    YYYY-MM-DD, required, within one calendar month
 *   `categories`    comma-separated category names; omit for all categories
 *   `export_type`   `excel` to download an .xlsx instead of JSON rows
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const range = parseDateRange(params.get("from"), params.get("to"), { singleMonth: true });
    const exportType = params.get("export_type");
    assertExportType(exportType, ["excel"]);

    const requested = parseIdList(params.get("categories"));
    const invoices = await invoiceRepository.listForBillingMonth(range.billingMonth);

    // No explicit selection means every category billed in the month.
    const categories =
      requested.length > 0 ? requested : Array.from(new Set(invoices.map((i) => i.vehicleCategory)));
    const rows = buildCategoryCostRows(invoices, categories);

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
    return errorResponse(error, "Failed to generate the category cost report.");
  }
}
