"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import FilterableReportPage, { FilterOption } from "@/components/reports/FilterableReportPage";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";

interface Row {
  id: string;
  department: string;
  trips: number;
  vehicleCount: number;
  distanceKm: number;
}

export default function DepartmentUtilizationReportPage() {
  const { requisitions, loading } = useReportData();

  const filterOptions: FilterOption[] = React.useMemo(() => {
    const departments = Array.from(new Set(requisitions.map((r) => r.department))).sort();
    return departments.map((d) => ({ id: d, label: d }));
  }, [requisitions]);

  const years = React.useMemo(() => {
    const now = new Date();
    const fromData = requisitions.map((r) => Number(r.requestDateTime.slice(0, 4))).filter((y) => !Number.isNaN(y));
    return Array.from(new Set([now.getFullYear(), ...fromData])).sort((a, b) => b - a);
  }, [requisitions]);

  const computeRows = React.useCallback(
    (selectedIds: string[], billingMonth: string): Row[] => {
      const filtered = requisitions.filter(
        (r) => r.requestDateTime.slice(0, 7) === billingMonth && selectedIds.includes(r.department)
      );
      const trips = groupSum(filtered, (r) => r.department, () => 1);
      const distance = groupSum(filtered, (r) => r.department, (r) => r.totalDistanceKm ?? 0);
      const vehicles = new Map<string, Set<string>>();
      filtered.forEach((r) => {
        if (!r.vehicleNumber) return;
        const set = vehicles.get(r.department) ?? new Set<string>();
        set.add(r.vehicleNumber);
        vehicles.set(r.department, set);
      });
      return Array.from(trips.keys()).map((dept) => ({
        id: dept,
        department: dept,
        trips: trips.get(dept) ?? 0,
        vehicleCount: vehicles.get(dept)?.size ?? 0,
        distanceKm: Math.round((distance.get(dept) ?? 0) * 10) / 10,
      }));
    },
    [requisitions]
  );

  const columns: GridColDef[] = [
    { field: "department", headerName: "Department", flex: 1.3, minWidth: 200 },
    { field: "trips", headerName: "Trip Count", flex: 0.8, minWidth: 110, type: "number" },
    { field: "vehicleCount", headerName: "Vehicles Used", flex: 0.8, minWidth: 130, type: "number" },
    { field: "distanceKm", headerName: "Total Distance (KM)", flex: 1, minWidth: 150, type: "number" },
  ];

  return (
    <FilterableReportPage
      title="Department-wise Vehicle Utilization Report"
      subtitle="Trip count and total distance travelled, grouped by requesting department."
      filterLabel="Department"
      filterOptions={filterOptions}
      years={years}
      loading={loading}
      computeRows={computeRows}
      columns={columns}
      exportFileNamePrefix="Department-Utilization-Report"
    />
  );
}
