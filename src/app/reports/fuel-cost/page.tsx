"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import FilterableReportPage, { FilterOption } from "@/components/reports/FilterableReportPage";
import { useReportData } from "@/lib/useReportData";
import { formatBDT } from "@/lib/billing";

interface Row {
  id: string;
  fuelType: string;
  total: number;
}

export default function FuelCostReportPage() {
  const { invoices, vehicles, loading } = useReportData();

  const vehicleFuel = React.useMemo(() => new Map(vehicles.map((v) => [v.vehicleNumber, v.fuelType])), [vehicles]);

  const filterOptions: FilterOption[] = React.useMemo(() => {
    const fuelTypes = Array.from(new Set(vehicles.map((v) => v.fuelType))).sort();
    return fuelTypes.map((f) => ({ id: f, label: f }));
  }, [vehicles]);

  const years = React.useMemo(() => {
    const now = new Date();
    const fromInvoices = invoices.map((i) => Number(i.billingMonth.slice(0, 4))).filter((y) => !Number.isNaN(y));
    return Array.from(new Set([now.getFullYear(), ...fromInvoices])).sort((a, b) => b - a);
  }, [invoices]);

  const computeRows = React.useCallback(
    (selectedIds: string[], billingMonth: string): Row[] => {
      const map = new Map<string, number>();
      invoices
        .filter((i) => i.billingMonth === billingMonth)
        .forEach((i) => {
          const fuel = vehicleFuel.get(i.vehicleNumber) ?? "Unknown";
          if (!selectedIds.includes(fuel)) return;
          map.set(fuel, (map.get(fuel) ?? 0) + i.totalBill);
        });
      return Array.from(map.entries()).map(([fuelType, total]) => ({ id: fuelType, fuelType, total }));
    },
    [invoices, vehicleFuel]
  );

  const columns: GridColDef[] = [
    { field: "fuelType", headerName: "Fuel Type", flex: 1.3, minWidth: 200 },
    { field: "total", headerName: "Total Cost", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <FilterableReportPage
      title="Fuel Type-wise Cost Analysis"
      subtitle="Total billed cost consolidated by vehicle fuel type (CNG, LPG, Octane, Diesel, Hybrid)."
      filterLabel="Fuel Type"
      filterOptions={filterOptions}
      years={years}
      loading={loading}
      computeRows={computeRows}
      columns={columns}
      exportFileNamePrefix="Fuel-Cost-Report"
    />
  );
}
