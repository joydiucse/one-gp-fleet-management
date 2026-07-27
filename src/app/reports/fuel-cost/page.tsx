"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import ReportPageLayout from "@/components/reports/ReportPageLayout";
import { useReportData } from "@/lib/useReportData";
import { formatBDT } from "@/lib/billing";

export default function FuelCostReportPage() {
  const { invoices, vehicles, loading } = useReportData();

  const rows = React.useMemo(() => {
    const vehicleFuel = new Map(vehicles.map((v) => [v.vehicleNumber, v.fuelType]));
    const map = new Map<string, number>();
    invoices.forEach((i) => {
      const fuel = vehicleFuel.get(i.vehicleNumber) ?? "Unknown";
      map.set(fuel, (map.get(fuel) ?? 0) + i.totalBill);
    });
    return Array.from(map.entries()).map(([fuelType, total], idx) => ({ id: idx, fuelType, total }));
  }, [invoices, vehicles]);

  const columns: GridColDef[] = [
    { field: "fuelType", headerName: "Fuel Type", flex: 1.3, minWidth: 200 },
    { field: "total", headerName: "Total Cost", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <ReportPageLayout
      title="Fuel Type-wise Cost Analysis"
      subtitle="Total billed cost consolidated by vehicle fuel type (CNG, LPG, Octane, Diesel, Hybrid)."
      rows={rows}
      columns={columns}
      loading={loading}
    />
  );
}
