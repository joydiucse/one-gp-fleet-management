"use client";

import * as React from "react";
import { GridColDef } from "@mui/x-data-grid";
import ReportPageLayout from "@/components/reports/ReportPageLayout";
import { useReportData } from "@/lib/useReportData";
import { groupSum } from "@/lib/groupSum";

export default function DepartmentUtilizationReportPage() {
  const { requisitions, loading } = useReportData();

  const rows = React.useMemo(() => {
    const trips = groupSum(requisitions, (r) => r.department, () => 1);
    const distance = groupSum(requisitions, (r) => r.department, (r) => r.totalDistanceKm ?? 0);
    return Array.from(trips.keys()).map((dept, idx) => ({
      id: idx,
      department: dept,
      trips: trips.get(dept) ?? 0,
      distanceKm: Math.round((distance.get(dept) ?? 0) * 10) / 10,
    }));
  }, [requisitions]);

  const columns: GridColDef[] = [
    { field: "department", headerName: "Department", flex: 1.3, minWidth: 200 },
    { field: "trips", headerName: "Trip Count", flex: 0.8, type: "number" },
    { field: "distanceKm", headerName: "Total Distance (KM)", flex: 1, type: "number" },
  ];

  return (
    <ReportPageLayout
      title="Department-wise Vehicle Utilization Report"
      subtitle="Trip count and total distance travelled, grouped by requesting department."
      rows={rows}
      columns={columns}
      loading={loading}
    />
  );
}
