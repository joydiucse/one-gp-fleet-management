"use client";

import { GridColDef } from "@mui/x-data-grid";
import ApiReportPage from "@/components/reports/ApiReportPage";

const columns: GridColDef[] = [
  { field: "driver", headerName: "Driver Name", flex: 1.3, minWidth: 200 },
  { field: "trips", headerName: "Trip Count", flex: 0.8, type: "number" },
  { field: "distanceKm", headerName: "Total Distance (KM)", flex: 1, type: "number" },
];

export default function DriverUtilizationReportPage() {
  return (
    <ApiReportPage
      title="Driver Utilization Report"
      subtitle="Trip count and total distance driven, grouped by driver."
      filterLabel="Driver"
      endpoint="/api/reports/driver-utilization"
      filterParam="drivers"
      columns={columns}
      exportFileNamePrefix="Driver-Utilization-Report"
    />
  );
}
