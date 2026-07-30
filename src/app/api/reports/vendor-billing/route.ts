import { NextRequest, NextResponse } from "next/server";
import { buildVendorBillingRows, listVendors } from "@/lib/vendorBillingReport";
import { buildVendorBillingWorkbook, vendorBillingFileName } from "@/lib/vendorBillingExcel";
import { errorResponse } from "@/server/errors";
import { assertExportType, parseDateRange, parseIdList, xlsxResponse } from "@/server/reports";
import { invoiceRepository } from "@/server/repositories/invoices";
import { requisitionRepository } from "@/server/repositories/requisitions";
import { vehicleRepository } from "@/server/repositories/vehicles";

export const runtime = "nodejs";

/**
 * Generates the vendor-wise billing report server-side.
 *
 * Query params:
 *   `from`, `to`    YYYY-MM-DD, required, within one calendar month
 *   `vendors`       comma-separated vendor names; omit for all vendors in range
 *   `export_type`   `excel` to download an .xlsx instead of JSON rows
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const range = parseDateRange(params.get("from"), params.get("to"), { singleMonth: true });
    const exportType = params.get("export_type");
    assertExportType(exportType, ["excel"]);

    const requestedVendors = parseIdList(params.get("vendors"));

    const [trips, vehicles, invoices] = await Promise.all([
      requisitionRepository.listTripsInRange(range.from, range.toExclusive),
      vehicleRepository.list(),
      invoiceRepository.listForBillingMonth(range.billingMonth),
    ]);

    // No explicit selection means every vendor with a trip in the range.
    const vendors = requestedVendors.length > 0 ? requestedVendors : listVendors(trips);
    const rows = buildVendorBillingRows(
      trips,
      vehicles,
      invoices,
      vendors,
      range.billingMonth,
      range
    );

    if (exportType === "excel") {
      const workbook = await buildVendorBillingWorkbook(rows, range.rangeLabel);
      return xlsxResponse(workbook, vendorBillingFileName(range.rangeLabel));
    }

    return NextResponse.json({
      from: range.from,
      to: range.to,
      billingMonth: range.billingMonth,
      rangeLabel: range.rangeLabel,
      rows,
    });
  } catch (error) {
    return errorResponse(error, "Failed to generate the vendor billing report.");
  }
}
