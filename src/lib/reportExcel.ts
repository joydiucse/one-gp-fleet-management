import ExcelJS from "exceljs";

export interface ReportExcelColumn {
  field: string;
  headerName: string;
  width?: number;
}

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
  right: { style: "thin" },
};

function autoWidth(header: string, values: unknown[]): number {
  const lengths = [header.length, ...values.map((v) => String(v ?? "").length)];
  return Math.min(Math.max(Math.max(...lengths, 0) + 2, 12), 42);
}

export async function exportSimpleReportExcel(
  rows: Record<string, unknown>[],
  columns: ReportExcelColumn[],
  reportTitle: string,
  monthLabel: string,
  fileNamePrefix: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(reportTitle.slice(0, 31) || "Report");

  sheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${reportTitle} - ${monthLabel}`;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 22;

  const HEADER_ROW = 2;
  columns.forEach((col, idx) => {
    const cell = sheet.getCell(HEADER_ROW, idx + 1);
    cell.value = col.headerName;
    cell.font = { bold: true, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = thinBorder;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F0" } };
    sheet.getColumn(idx + 1).width = col.width ?? autoWidth(col.headerName, rows.map((r) => r[col.field]));
  });
  sheet.getRow(HEADER_ROW).height = 22;

  rows.forEach((row, rowIdx) => {
    const excelRow = sheet.getRow(HEADER_ROW + 1 + rowIdx);
    columns.forEach((col, colIdx) => {
      const value = row[col.field];
      const cell = excelRow.getCell(colIdx + 1);
      cell.value = (value as string | number) ?? "";
      cell.border = thinBorder;
      cell.alignment = { vertical: "middle", horizontal: typeof value === "number" ? "right" : "left" };
    });
  });

  sheet.views = [{ state: "frozen", ySplit: HEADER_ROW }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileNamePrefix}-${monthLabel.replace(/\s+/g, "-")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
