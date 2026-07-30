"use client";

import { GridColDef } from "@mui/x-data-grid";
import ApiReportPage from "@/components/reports/ApiReportPage";

const columns: GridColDef[] = [
  { field: "department", headerName: "Department", flex: 1.3, minWidth: 200 },
  { field: "trips", headerName: "Trip Count", flex: 0.8, minWidth: 110, type: "number" },
  { field: "vehicleCount", headerName: "Vehicles Used", flex: 0.8, minWidth: 130, type: "number" },
  { field: "distanceKm", headerName: "Total Distance (KM)", flex: 1, minWidth: 150, type: "number" },
];

export default function DepartmentUtilizationReportPage() {
  return (
    <ApiReportPage
      title="Department-wise Vehicle Utilization Report"
      subtitle="Trip count and total distance travelled, grouped by requesting department."
      filterLabel="Department"
      endpoint="/api/reports/department-utilization"
      filterParam="departments"
      columns={columns}
      exportFileNamePrefix="Department-Utilization-Report"
    />
  );
}
