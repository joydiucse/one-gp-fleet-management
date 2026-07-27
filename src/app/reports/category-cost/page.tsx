"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import ReportPageLayout from "@/components/reports/ReportPageLayout";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";
import { formatBDT } from "@/lib/billing";

export default function CategoryCostReportPage() {
  const { invoices, loading } = useReportData();

  const rows = React.useMemo(() => {
    const map = groupSum(invoices, (i) => i.vehicleCategory, (i) => i.totalBill);
    return Array.from(map.entries()).map(([category, total], idx) => ({ id: idx, category, total }));
  }, [invoices]);

  const columns: GridColDef[] = [
    { field: "category", headerName: "Vehicle Category", flex: 1.3, minWidth: 200 },
    { field: "total", headerName: "Total Cost", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <ReportPageLayout
      title="Vehicle Category-wise Cost Analysis"
      subtitle="Total billed cost consolidated by vehicle category (Sedan, SUV, Microbus, etc.)."
      rows={rows}
      columns={columns}
      loading={loading}
    />
  );
}
