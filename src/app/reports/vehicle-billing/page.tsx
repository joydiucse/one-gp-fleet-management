"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import ReportPageLayout from "@/components/reports/ReportPageLayout";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";
import { formatBDT } from "@/lib/billing";

export default function VehicleBillingReportPage() {
  const { invoices, loading } = useReportData();

  const rows = React.useMemo(() => {
    const map = groupSum(invoices, (i) => i.vehicleNumber, (i) => i.totalBill);
    return Array.from(map.entries()).map(([vehicleNumber, total], idx) => ({ id: idx, vehicleNumber, total }));
  }, [invoices]);

  const columns: GridColDef[] = [
    { field: "vehicleNumber", headerName: "Vehicle Number", flex: 1.3, minWidth: 200 },
    { field: "total", headerName: "Total Billed", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <ReportPageLayout
      title="Monthly Vehicle-wise Billing Report"
      subtitle="Total billed amount consolidated by vehicle across all invoiced billing months."
      rows={rows}
      columns={columns}
      loading={loading}
    />
  );
}
