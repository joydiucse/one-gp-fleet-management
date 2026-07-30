"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import FilterableReportPage, { FilterOption } from "@/components/reports/FilterableReportPage";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";

interface Row {
  id: string;
  driver: string;
  trips: number;
  distanceKm: number;
}

export default function DriverUtilizationReportPage() {
  const { requisitions, loading } = useReportData();

  const filterOptions: FilterOption[] = React.useMemo(() => {
    const drivers = Array.from(new Set(requisitions.map((r) => r.driverName ?? "Unassigned"))).sort();
    return drivers.map((d) => ({ id: d, label: d }));
  }, [requisitions]);

  const years = React.useMemo(() => {
    const now = new Date();
    const fromData = requisitions.map((r) => Number(r.requestDateTime.slice(0, 4))).filter((y) => !Number.isNaN(y));
    return Array.from(new Set([now.getFullYear(), ...fromData])).sort((a, b) => b - a);
  }, [requisitions]);

  const computeRows = React.useCallback(
    (selectedIds: string[], billingMonth: string): Row[] => {
      const filtered = requisitions.filter(
        (r) => r.requestDateTime.slice(0, 7) === billingMonth && selectedIds.includes(r.driverName ?? "Unassigned")
      );
      const trips = groupSum(filtered, (r) => r.driverName ?? "Unassigned", () => 1);
      const distance = groupSum(filtered, (r) => r.driverName ?? "Unassigned", (r) => r.totalDistanceKm ?? 0);
      return Array.from(trips.keys()).map((driver) => ({
        id: driver,
        driver,
        trips: trips.get(driver) ?? 0,
        distanceKm: Math.round((distance.get(driver) ?? 0) * 10) / 10,
      }));
    },
    [requisitions]
  );

  const columns: GridColDef[] = [
    { field: "driver", headerName: "Driver Name", flex: 1.3, minWidth: 200 },
    { field: "trips", headerName: "Trip Count", flex: 0.8, type: "number" },
    { field: "distanceKm", headerName: "Total Distance (KM)", flex: 1, type: "number" },
  ];

  return (
    <FilterableReportPage
      title="Driver Utilization Report"
      subtitle="Trip count and total distance driven, grouped by driver."
      filterLabel="Driver"
      filterOptions={filterOptions}
      years={years}
      loading={loading}
      computeRows={computeRows}
      columns={columns}
      exportFileNamePrefix="Driver-Utilization-Report"
    />
  );
}
