import ExcelJS from "exceljs";
import { VendorBillingRow } from "./vendorBillingReport";

/**
 * The vendor billing workbook: the same grouped header layout as the vehicle
 * billing export, with the vehicle identity columns replaced by the vendor and
 * its vehicle/trip counts.
 */

interface HeaderGroup {
  label: string;
  span: number;
  sub?: string[];
}

const HEADER_GROUPS: HeaderGroup[] = [
  { label: "SL No.", span: 1 },
  { label: "Vendor", span: 1 },
  { label: "Vehicles", span: 1 },
  { label: "Trips", span: 1 },
  { label: "Vehicle Usage Duration", span: 2, sub: ["From", "To"] },
  { label: "Fuel cons. Rate Oct/LPG/CNG/Hybride @ BDT 130/60/43/130", span: 1 },
  { label: "Total KM Run as per Log Book", span: 1 },
  { label: "Fuel Wise KM Distribution", span: 4, sub: ["Octane", "LPG", "CNG", "Hybrid"] },
  { label: "KM Rate Including Tax", span: 4, sub: ["Octane", "LPG", "CNG", "Hybrid"] },
  { label: "Total KM Cost", span: 5, sub: ["Octane", "LPG", "CNG", "Hybrid", "Total"] },
  { label: "Start-Up Fuel Cost with Tax", span: 1 },
  { label: "Driver DA with Tax", span: 2, sub: ["Days", "Amount"] },
  { label: "Toll/Parking With Tax", span: 2, sub: ["Toll", "Parking"] },
  { label: "Rent Amount with Tax", span: 1 },
  { label: "Extra Service Charge with Tax", span: 3, sub: ["Rate", "Hour", "Amount"] },
  { label: "Mobile Bill", span: 1 },
  { label: "Adjustment/Absent", span: 1 },
  { label: "Ifter Bill Rate With 4% Tax@165", span: 1 },
  { label: "Number Of Days", span: 1 },
  { label: "Ifter Bill Amount", span: 1 },
  { label: "Total Amount", span: 1 },
  { label: "Add 15%", span: 1 },
  { label: "Total Amount With Vat & Tax", span: 1 },
];

const TOTAL_COLUMNS = HEADER_GROUPS.reduce((sum, g) => sum + g.span, 0);

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

function autoWidth(labels: string[], values: unknown[]): number {
  const lengths = [...labels.map((l) => l.length), ...values.map((v) => String(v ?? "").length)];
  return Math.min(Math.max(Math.max(...lengths, 0) + 2, 12), 42);
}

function rowValues(row: VendorBillingRow, sl: number): (string | number)[] {
  return [
    sl,
    row.vendor,
    row.vehicleCount,
    row.tripCount,
    row.usageFrom,
    row.usageTo,
    row.fuelConsRate,
    row.totalKmRun,
    row.kmOctane,
    row.kmLPG,
    row.kmCNG,
    row.kmHybrid,
    row.rateOctane,
    row.rateLPG,
    row.rateCNG,
    row.rateHybrid,
    row.costOctane,
    row.costLPG,
    row.costCNG,
    row.costHybrid,
    row.totalKmCost,
    row.startupFuelCost,
    row.driverDaDays,
    row.driverDaAmount,
    row.tollCharge,
    row.parkingCharge,
    row.rentAmount,
    row.extraServiceRate,
    row.extraServiceHour,
    row.extraServiceAmount,
    row.mobileBill,
    row.adjustmentAbsent,
    row.iftarBillRate,
    row.iftarBillDays,
    row.iftarBillAmount,
    row.totalAmount,
    row.vatAmount,
    row.grandTotal,
  ];
}

/** File name used for both the download header and the browser save dialog. */
export function vendorBillingFileName(rangeLabel: string): string {
  return `Vendor-Billing-Report-${rangeLabel.replace(/\s+/g, "-")}.xlsx`;
}

/**
 * Builds the vendor billing workbook. Kept free of DOM APIs so the report API
 * route can stream it straight to the client.
 */
export async function buildVendorBillingWorkbook(
  rows: VendorBillingRow[],
  rangeLabel: string
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Vendor Billing");

  sheet.mergeCells(1, 1, 1, TOTAL_COLUMNS);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `Vendor-wise Billing Report - ${rangeLabel}`;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 22;

  const HEADER_ROW = 2;
  const SUB_HEADER_ROW = 3;
  const DATA_START_ROW = 4;

  const columnLabels: string[] = new Array(TOTAL_COLUMNS).fill("");
  let col = 1;
  for (const group of HEADER_GROUPS) {
    const headerCell = sheet.getCell(HEADER_ROW, col);
    headerCell.value = group.label;
    if (group.span > 1) {
      sheet.mergeCells(HEADER_ROW, col, HEADER_ROW, col + group.span - 1);
      group.sub?.forEach((label, i) => {
        const subCell = sheet.getCell(SUB_HEADER_ROW, col + i);
        subCell.value = label;
        columnLabels[col + i - 1] = label;
      });
    } else {
      sheet.mergeCells(HEADER_ROW, col, SUB_HEADER_ROW, col);
      columnLabels[col - 1] = group.label;
    }
    col += group.span;
  }

  for (let r = HEADER_ROW; r <= SUB_HEADER_ROW; r++) {
    for (let c = 1; c <= TOTAL_COLUMNS; c++) {
      const cell = sheet.getCell(r, c);
      cell.font = { bold: true, size: 9 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = thinBorder;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    }
  }
  sheet.getRow(HEADER_ROW).height = 30;
  sheet.getRow(SUB_HEADER_ROW).height = 18;

  const allRowValues = rows.map((row, idx) => rowValues(row, idx + 1));
  allRowValues.forEach((values, idx) => {
    const excelRow = sheet.getRow(DATA_START_ROW + idx);
    values.forEach((value, i) => {
      const cell = excelRow.getCell(i + 1);
      cell.value = value;
      cell.border = thinBorder;
      cell.alignment = { vertical: "middle", horizontal: typeof value === "number" ? "right" : "left" };
    });
  });

  for (let c = 1; c <= TOTAL_COLUMNS; c++) {
    const columnValues = allRowValues.map((values) => values[c - 1]);
    sheet.getColumn(c).width = autoWidth([columnLabels[c - 1]], columnValues);
  }

  sheet.views = [{ state: "frozen", ySplit: SUB_HEADER_ROW }];

  return workbook;
}
