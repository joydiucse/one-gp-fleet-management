"use client";

import { GridColDef } from "@mui/x-data-grid";
import ApiReportPage from "@/components/reports/ApiReportPage";
import { formatBDT } from "@/lib/billing";

const columns: GridColDef[] = [
  { field: "fuelType", headerName: "Fuel Type", flex: 1.3, minWidth: 200 },
  { field: "total", headerName: "Total Cost", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
];

export default function FuelCostReportPage() {
  return (
    <ApiReportPage
      title="Fuel Type-wise Cost Analysis"
      subtitle="Total billed cost consolidated by vehicle fuel type (CNG, LPG, Octane, Diesel, Hybrid)."
      filterLabel="Fuel Type"
      endpoint="/api/reports/fuel-cost"
      filterParam="fuelTypes"
      singleMonth
      columns={columns}
      exportFileNamePrefix="Fuel-Cost-Report"
    />
  );
}
