"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import FilterableReportPage, { FilterOption } from "@/components/reports/FilterableReportPage";
import { useReportData } from "@/lib/useReportData";
import { formatBDT } from "@/lib/billing";

interface Row {
  id: string;
  vendor: string;
  tripCount: number;
  vehicleCount: number;
  distanceKm: number;
  total: number;
}

export default function VendorBillingReportPage() {
  const { invoices, requisitions, loading } = useReportData();

  // Vendor is captured per trip requisition (Requisition.vendor), not on the invoice —
  // the vendor list and grouping below are driven by Trip Requisitions data.
  const filterOptions: FilterOption[] = React.useMemo(() => {
    const vendors = Array.from(new Set(requisitions.map((r) => r.vendor).filter((v): v is string => !!v))).sort();
    return vendors.map((v) => ({ id: v, label: v }));
  }, [requisitions]);

  const years = React.useMemo(() => {
    const now = new Date();
    const fromData = requisitions.map((r) => Number(r.requestDateTime.slice(0, 4))).filter((y) => !Number.isNaN(y));
    return Array.from(new Set([now.getFullYear(), ...fromData])).sort((a, b) => b - a);
  }, [requisitions]);

  const computeRows = React.useCallback(
    (selectedIds: string[], billingMonth: string): Row[] => {
      const reqsInMonth = requisitions.filter(
        (r) => r.requestDateTime.slice(0, 7) === billingMonth && r.vendor && selectedIds.includes(r.vendor)
      );

      const byVendor = new Map<string, { trips: number; vehicles: Set<string>; distanceKm: number }>();
      reqsInMonth.forEach((r) => {
        const vendor = r.vendor as string;
        const entry = byVendor.get(vendor) ?? { trips: 0, vehicles: new Set<string>(), distanceKm: 0 };
        entry.trips += 1;
        if (r.vehicleNumber) entry.vehicles.add(r.vehicleNumber);
        entry.distanceKm += r.totalDistanceKm ?? 0;
        byVendor.set(vendor, entry);
      });

      return Array.from(byVendor.entries()).map(([vendor, entry]) => {
        const total = Array.from(entry.vehicles).reduce((sum, vehicleNumber) => {
          const invoice = invoices.find((i) => i.vehicleNumber === vehicleNumber && i.billingMonth === billingMonth);
          return sum + (invoice?.totalBill ?? 0);
        }, 0);
        return {
          id: vendor,
          vendor,
          tripCount: entry.trips,
          vehicleCount: entry.vehicles.size,
          distanceKm: Math.round(entry.distanceKm * 10) / 10,
          total,
        };
      });
    },
    [requisitions, invoices]
  );

  const columns: GridColDef[] = [
    { field: "vendor", headerName: "Vendor", flex: 1.2, minWidth: 180 },
    { field: "tripCount", headerName: "Trip Count", flex: 0.7, minWidth: 110, type: "number" },
    { field: "vehicleCount", headerName: "Vehicles Used", flex: 0.8, minWidth: 130, type: "number" },
    { field: "distanceKm", headerName: "Total Distance (KM)", flex: 0.9, minWidth: 150, type: "number" },
    { field: "total", headerName: "Total Billed", flex: 1, minWidth: 140, valueFormatter: (v: number) => formatBDT(v) },
  ];

  return (
    <FilterableReportPage
      title="Vendor-wise Billing Report"
      subtitle="Total billed amount consolidated by vendor, based on the vendor assigned on each trip requisition."
      filterLabel="Vendor"
      filterOptions={filterOptions}
      years={years}
      loading={loading}
      computeRows={computeRows}
      columns={columns}
      exportFileNamePrefix="Vendor-Billing-Report"
    />
  );
}
