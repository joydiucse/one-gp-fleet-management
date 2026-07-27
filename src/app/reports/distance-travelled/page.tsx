"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import ReportPageLayout from "@/components/reports/ReportPageLayout";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";

export default function DistanceTravelledReportPage() {
  const { requisitions, loading } = useReportData();

  const rows = React.useMemo(() => {
    const map = groupSum(requisitions, (r) => r.vehicleNumber ?? "Unassigned", (r) => r.totalDistanceKm ?? 0);
    return Array.from(map.entries()).map(([vehicleNumber, distanceKm], idx) => ({
      id: idx,
      vehicleNumber,
      distanceKm: Math.round(distanceKm * 10) / 10,
    }));
  }, [requisitions]);

  const columns: GridColDef[] = [
    { field: "vehicleNumber", headerName: "Vehicle Number", flex: 1.3, minWidth: 200 },
    { field: "distanceKm", headerName: "Total Distance (KM)", flex: 1, type: "number" },
  ];

  return (
    <ReportPageLayout
      title="Distance Travelled Report"
      subtitle="Total distance travelled per vehicle, based on completed trip requisitions."
      rows={rows}
      columns={columns}
      loading={loading}
    />
  );
}
