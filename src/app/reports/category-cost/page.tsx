"use client";

import { GridColDef } from "@mui/x-data-grid";
import ApiReportPage from "@/components/reports/ApiReportPage";
import { formatBDT } from "@/lib/billing";

const columns: GridColDef[] = [
  { field: "category", headerName: "Vehicle Category", flex: 1.3, minWidth: 200 },
  { field: "total", headerName: "Total Cost", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
];

export default function CategoryCostReportPage() {
  return (
    <ApiReportPage
      title="Vehicle Category-wise Cost Analysis"
      subtitle="Total billed cost consolidated by vehicle category (Sedan, SUV, Microbus, etc.)."
      filterLabel="Category"
      filterLabelPlural="Categories"
      endpoint="/api/reports/category-cost"
      filterParam="categories"
      singleMonth
      columns={columns}
      exportFileNamePrefix="Category-Cost-Report"
    />
  );
}
