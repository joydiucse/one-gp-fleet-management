"use client";

import { GridColDef } from "@mui/x-data-grid";
import ApiReportPage from "@/components/reports/ApiReportPage";
import { formatBDT } from "@/lib/billing";

const columns: GridColDef[] = [
  { field: "vendor", headerName: "Vendor", flex: 1.2, minWidth: 180 },
  { field: "vehicleCount", headerName: "Vehicles", flex: 0.6, minWidth: 100, type: "number" },
  { field: "tripCount", headerName: "Trips", flex: 0.6, minWidth: 90, type: "number" },
  { field: "rentAmount", headerName: "Rent Amount", flex: 0.8, minWidth: 130, valueFormatter: (v: number) => formatBDT(v) },
  { field: "totalKmRun", headerName: "Total KM Run", flex: 0.8, minWidth: 120, type: "number" },
  { field: "totalKmCost", headerName: "Total KM Cost", flex: 0.9, minWidth: 130, valueFormatter: (v: number) => formatBDT(v) },
  { field: "mobileBill", headerName: "Mobile Bill", flex: 0.8, minWidth: 120, valueFormatter: (v: number) => formatBDT(v) },
  { field: "totalAmount", headerName: "Total Amount", flex: 0.9, minWidth: 140, valueFormatter: (v: number) => formatBDT(v) },
  { field: "grandTotal", headerName: "Total With VAT", flex: 0.9, minWidth: 150, valueFormatter: (v: number) => formatBDT(v) },
];

export default function VendorBillingReportPage() {
  return (
    <ApiReportPage
      title="Vendor-wise Billing Report"
      subtitle="Vendor-wise billing breakdown — rent, fuel, DA, toll/parking and Iftar bill charges of the vehicles each vendor ran trips with."
      filterLabel="Vendor"
      endpoint="/api/reports/vendor-billing"
      filterParam="vendors"
      singleMonth
      columns={columns}
      exportFileNamePrefix="Vendor-Billing-Report"
    />
  );
}
