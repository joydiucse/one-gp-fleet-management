"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import FilterableReportPage, { FilterOption } from "@/components/reports/FilterableReportPage";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";

interface Row {
  id: string;
  vehicleNumber: string;
  distanceKm: number;
}

export default function DistanceTravelledReportPage() {
  const { requisitions, loading } = useReportData();

  const filterOptions: FilterOption[] = React.useMemo(() => {
    const vehicleNumbers = Array.from(new Set(requisitions.map((r) => r.vehicleNumber ?? "Unassigned"))).sort();
    return vehicleNumbers.map((v) => ({ id: v, label: v }));
  }, [requisitions]);

  const years = React.useMemo(() => {
    const now = new Date();
    const fromData = requisitions.map((r) => Number(r.requestDateTime.slice(0, 4))).filter((y) => !Number.isNaN(y));
    return Array.from(new Set([now.getFullYear(), ...fromData])).sort((a, b) => b - a);
  }, [requisitions]);

  const computeRows = React.useCallback(
    (selectedIds: string[], billingMonth: string): Row[] => {
      const filtered = requisitions.filter(
        (r) => r.requestDateTime.slice(0, 7) === billingMonth && selectedIds.includes(r.vehicleNumber ?? "Unassigned")
      );
      const map = groupSum(filtered, (r) => r.vehicleNumber ?? "Unassigned", (r) => r.totalDistanceKm ?? 0);
      return Array.from(map.entries()).map(([vehicleNumber, distanceKm]) => ({
        id: vehicleNumber,
        vehicleNumber,
        distanceKm: Math.round(distanceKm * 10) / 10,
      }));
    },
    [requisitions]
  );

  const columns: GridColDef[] = [
    { field: "vehicleNumber", headerName: "Vehicle Number", flex: 1.3, minWidth: 200 },
    { field: "distanceKm", headerName: "Total Distance (KM)", flex: 1, type: "number" },
  ];

  return (
    <FilterableReportPage
      title="Distance Travelled Report"
      subtitle="Total distance travelled per vehicle, based on completed trip requisitions."
      filterLabel="Vehicle"
      filterOptions={filterOptions}
      years={years}
      loading={loading}
      computeRows={computeRows}
      columns={columns}
      exportFileNamePrefix="Distance-Travelled-Report"
    />
  );
}
