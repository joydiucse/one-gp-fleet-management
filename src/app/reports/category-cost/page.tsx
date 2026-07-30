"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import FilterableReportPage, { FilterOption } from "@/components/reports/FilterableReportPage";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";
import { formatBDT } from "@/lib/billing";

interface Row {
  id: string;
  category: string;
  total: number;
}

export default function CategoryCostReportPage() {
  const { invoices, loading } = useReportData();

  const filterOptions: FilterOption[] = React.useMemo(() => {
    const categories = Array.from(new Set(invoices.map((i) => i.vehicleCategory))).sort();
    return categories.map((c) => ({ id: c, label: c }));
  }, [invoices]);

  const years = React.useMemo(() => {
    const now = new Date();
    const fromInvoices = invoices.map((i) => Number(i.billingMonth.slice(0, 4))).filter((y) => !Number.isNaN(y));
    return Array.from(new Set([now.getFullYear(), ...fromInvoices])).sort((a, b) => b - a);
  }, [invoices]);

  const computeRows = React.useCallback(
    (selectedIds: string[], billingMonth: string): Row[] => {
      const filtered = invoices.filter((i) => i.billingMonth === billingMonth && selectedIds.includes(i.vehicleCategory));
      const map = groupSum(filtered, (i) => i.vehicleCategory, (i) => i.totalBill);
      return Array.from(map.entries()).map(([category, total]) => ({ id: category, category, total }));
    },
    [invoices]
  );

  const columns: GridColDef[] = [
    { field: "category", headerName: "Vehicle Category", flex: 1.3, minWidth: 200 },
    { field: "total", headerName: "Total Cost", flex: 1, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <FilterableReportPage
      title="Vehicle Category-wise Cost Analysis"
      subtitle="Total billed cost consolidated by vehicle category (Sedan, SUV, Microbus, etc.)."
      filterLabel="Category"
      filterOptions={filterOptions}
      years={years}
      loading={loading}
      computeRows={computeRows}
      columns={columns}
      exportFileNamePrefix="Category-Cost-Report"
    />
  );
}
