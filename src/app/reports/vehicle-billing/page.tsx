"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PageHeader from "@/components/common/PageHeader";
import { useReportData } from "@/lib/useReportData";
import { formatBDT } from "@/lib/billing";
import { buildVehicleBillingRows } from "@/lib/vehicleBillingReport";
import { exportVehicleBillingExcel } from "@/lib/vehicleBillingExcel";

const ALL_VALUE = "__all__";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function VehicleBillingReportPage() {
  const { invoices, vehicles, loading } = useReportData();

  const now = React.useMemo(() => new Date(), []);
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());
  const [selectedVehicleIds, setSelectedVehicleIds] = React.useState<string[]>([]);
  const [toast, setToast] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  const billingMonth = `${year}-${String(month).padStart(2, "0")}`;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;

  interface AppliedFilters {
    vehicleIds: string[];
    billingMonth: string;
    monthLabel: string;
  }
  const [appliedFilters, setAppliedFilters] = React.useState<AppliedFilters | null>(null);

  React.useEffect(() => {
    if (vehicles.length > 0 && selectedVehicleIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- default the vehicle filter to "all" once vehicles arrive from the API
      setSelectedVehicleIds(vehicles.map((v) => v.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only seed selection once vehicles arrive
  }, [vehicles]);

  const years = React.useMemo(() => {
    const fromInvoices = invoices.map((i) => Number(i.billingMonth.slice(0, 4))).filter((y) => !Number.isNaN(y));
    const set = new Set([now.getFullYear(), ...fromInvoices]);
    return Array.from(set).sort((a, b) => b - a);
  }, [invoices, now]);

  const rows = React.useMemo(
    () =>
      appliedFilters
        ? buildVehicleBillingRows(invoices, vehicles, appliedFilters.vehicleIds, appliedFilters.billingMonth)
        : [],
    [invoices, vehicles, appliedFilters]
  );

  const handleVehicleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const next = typeof value === "string" ? value.split(",") : value;
    if (next.includes(ALL_VALUE)) {
      setSelectedVehicleIds(selectedVehicleIds.length === vehicles.length ? [] : vehicles.map((v) => v.id));
      return;
    }
    setSelectedVehicleIds(next);
  };

  const handleSearch = () => {
    setAppliedFilters({ vehicleIds: selectedVehicleIds, billingMonth, monthLabel });
  };

  const handleExport = async () => {
    if (!appliedFilters || rows.length === 0) {
      setToast("Run a search first to load the report before exporting.");
      return;
    }
    setExporting(true);
    try {
      await exportVehicleBillingExcel(rows, appliedFilters.monthLabel);
    } finally {
      setExporting(false);
    }
  };

  const columns: GridColDef[] = [
    { field: "vehicleNumber", headerName: "Vehicle No.", flex: 1.2, minWidth: 190 },
    { field: "vehicleType", headerName: "Vehicle Type", flex: 0.9, minWidth: 140 },
    { field: "rentAmount", headerName: "Rent Amount", flex: 0.8, minWidth: 130, valueFormatter: (v: number) => formatBDT(v) },
    { field: "totalKmRun", headerName: "Total KM Run", flex: 0.8, minWidth: 120, type: "number" },
    { field: "totalKmCost", headerName: "Total KM Cost", flex: 0.9, minWidth: 130, valueFormatter: (v: number) => formatBDT(v) },
    { field: "mobileBill", headerName: "Mobile Bill", flex: 0.8, minWidth: 120, valueFormatter: (v: number) => formatBDT(v) },
    { field: "totalAmount", headerName: "Total Amount", flex: 0.9, minWidth: 140, valueFormatter: (v: number) => formatBDT(v) },
    { field: "grandTotal", headerName: "Total With VAT", flex: 0.9, minWidth: 150, valueFormatter: (v: number) => formatBDT(v) },
  ];

  const gridRows = rows.map((r) => ({ id: r.vehicleId, ...r }));

  return (
    <Box>
      <PageHeader
        title="Vehicle Billing Report"
        subtitle="Vehicle-wise monthly billing breakdown including rent, fuel, DA, toll/parking and Iftar bill charges."
        breadcrumbs={[{ label: "Reports", href: "/reports" }, { label: "Vehicle Billing Report" }]}
        action={
          <Button
            variant="contained"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Export Excel"}
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="vehicle-billing-vehicle-label">Vehicle</InputLabel>
              <Select
                labelId="vehicle-billing-vehicle-label"
                label="Vehicle"
                multiple
                value={selectedVehicleIds}
                onChange={handleVehicleChange}
                renderValue={(selected) =>
                  selected.length === vehicles.length
                    ? "All Vehicles"
                    : `${selected.length} vehicle${selected.length === 1 ? "" : "s"} selected`
                }
              >
                <MenuItem value={ALL_VALUE}>
                  <Checkbox
                    checked={vehicles.length > 0 && selectedVehicleIds.length === vehicles.length}
                    indeterminate={selectedVehicleIds.length > 0 && selectedVehicleIds.length < vehicles.length}
                  />
                  <ListItemText primary="Select All" />
                </MenuItem>
                {vehicles.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    <Checkbox checked={selectedVehicleIds.indexOf(v.id) > -1} />
                    <ListItemText primary={`${v.vehicleNumber} — ${v.category}`} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 3.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTH_NAMES.map((m, idx) => (
                <MenuItem key={m} value={idx + 1}>{m}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 1 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SearchRoundedIcon />}
              onClick={handleSearch}
              sx={{ height: 40 }}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Card>

      {appliedFilters ? (
        <Card>
          <DataGrid
            autoHeight
            rows={gridRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ border: "none" }}
          />
        </Card>
      ) : (
        <Card sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
          Select a vehicle, month and year, then click Search to generate the report.
        </Card>
      )}

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        <Alert severity="warning" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
