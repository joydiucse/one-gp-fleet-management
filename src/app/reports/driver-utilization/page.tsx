"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import ReportPageLayout from "@/components/reports/ReportPageLayout";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";

export default function DriverUtilizationReportPage() {
  const { requisitions, loading } = useReportData();

  const rows = React.useMemo(() => {
    const trips = groupSum(requisitions, (r) => r.driverName ?? "Unassigned", () => 1);
    const distance = groupSum(requisitions, (r) => r.driverName ?? "Unassigned", (r) => r.totalDistanceKm ?? 0);
    return Array.from(trips.keys()).map((driver, idx) => ({
      id: idx,
      driver,
      trips: trips.get(driver) ?? 0,
      distanceKm: Math.round((distance.get(driver) ?? 0) * 10) / 10,
    }));
  }, [requisitions]);

  const columns: GridColDef[] = [
    { field: "driver", headerName: "Driver Name", flex: 1.3, minWidth: 200 },
    { field: "trips", headerName: "Trip Count", flex: 0.8, type: "number" },
    { field: "distanceKm", headerName: "Total Distance (KM)", flex: 1, type: "number" },
  ];

  return (
    <ReportPageLayout
      title="Driver Utilization Report"
      subtitle="Trip count and total distance driven, grouped by driver."
      rows={rows}
      columns={columns}
      loading={loading}
    />
  );
}
