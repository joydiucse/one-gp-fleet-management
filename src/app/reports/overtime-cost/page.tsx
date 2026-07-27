"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import ReportPageLayout from "@/components/reports/ReportPageLayout";
import { useReportData } from "@/lib/useReportData";
import { formatBDT } from "@/lib/billing";

export default function OvertimeCostReportPage() {
  const { invoices, loading } = useReportData();

  const rows = React.useMemo(() => {
    return invoices
      .filter((i) => i.charges.otCharge > 0)
      .map((i, idx) => ({ id: idx, vehicleNumber: i.vehicleNumber, otHours: i.charges.otHours, otCharge: i.charges.otCharge }));
  }, [invoices]);

  const columns: GridColDef[] = [
    { field: "vehicleNumber", headerName: "Vehicle Number", flex: 1.3, minWidth: 200 },
    { field: "otHours", headerName: "OT Hours", flex: 0.8, type: "number" },
    { field: "otCharge", headerName: "OT Cost", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <ReportPageLayout
      title="Overtime Cost Report"
      subtitle="Overtime hours and OT charges billed per vehicle for trips exceeding working hours."
      rows={rows}
      columns={columns}
      loading={loading}
    />
  );
}
