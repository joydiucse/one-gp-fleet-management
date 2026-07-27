"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import ReportPageLayout from "@/components/reports/ReportPageLayout";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";
import { formatBDT } from "@/lib/billing";

export default function VendorBillingReportPage() {
  const { invoices, loading } = useReportData();

  const rows = React.useMemo(() => {
    const map = groupSum(invoices, (i) => i.partner, (i) => i.totalBill);
    return Array.from(map.entries()).map(([partner, total], idx) => ({ id: idx, partner, total }));
  }, [invoices]);

  const columns: GridColDef[] = [
    { field: "partner", headerName: "Vendor / Partner", flex: 1.3, minWidth: 200 },
    { field: "total", headerName: "Total Billed", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <ReportPageLayout
      title="Vendor-wise Billing Report"
      subtitle="Total billed amount consolidated by vendor / fleet partner."
      rows={rows}
      columns={columns}
      loading={loading}
    />
  );
}
