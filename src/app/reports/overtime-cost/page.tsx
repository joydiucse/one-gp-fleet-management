"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import FilterableReportPage, { FilterOption } from "@/components/reports/FilterableReportPage";
import { useReportData } from "@/lib/useReportData";
import { formatBDT } from "@/lib/billing";

interface Row {
  id: string;
  vehicleNumber: string;
  otHours: number;
  otCharge: number;
}

export default function OvertimeCostReportPage() {
  const { invoices, loading } = useReportData();

  const filterOptions: FilterOption[] = React.useMemo(() => {
    const vehicleNumbers = Array.from(new Set(invoices.filter((i) => i.charges.otCharge > 0).map((i) => i.vehicleNumber))).sort();
    return vehicleNumbers.map((v) => ({ id: v, label: v }));
  }, [invoices]);

  const years = React.useMemo(() => {
    const now = new Date();
    const fromInvoices = invoices.map((i) => Number(i.billingMonth.slice(0, 4))).filter((y) => !Number.isNaN(y));
    return Array.from(new Set([now.getFullYear(), ...fromInvoices])).sort((a, b) => b - a);
  }, [invoices]);

  const computeRows = React.useCallback(
    (selectedIds: string[], billingMonth: string): Row[] => {
      return invoices
        .filter((i) => i.charges.otCharge > 0 && i.billingMonth === billingMonth && selectedIds.includes(i.vehicleNumber))
        .map((i) => ({ id: i.id, vehicleNumber: i.vehicleNumber, otHours: i.charges.otHours, otCharge: i.charges.otCharge }));
    },
    [invoices]
  );

  const columns: GridColDef[] = [
    { field: "vehicleNumber", headerName: "Vehicle Number", flex: 1.3, minWidth: 200 },
    { field: "otHours", headerName: "OT Hours", flex: 0.8, type: "number" },
    { field: "otCharge", headerName: "OT Cost", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <FilterableReportPage
      title="Overtime Cost Report"
      subtitle="Overtime hours and OT charges billed per vehicle for trips exceeding working hours."
      filterLabel="Vehicle"
      filterOptions={filterOptions}
      years={years}
      loading={loading}
      computeRows={computeRows}
      columns={columns}
      exportFileNamePrefix="Overtime-Cost-Report"
    />
  );
}
