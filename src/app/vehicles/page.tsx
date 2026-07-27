"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { VEHICLE_CATEGORIES, FUEL_TYPES } from "@/data/rateCards";
import { Vehicle } from "@/types";
import { useCollection } from "@/lib/useCollection";

const emptyVehicle: Omit<Vehicle, "id"> = {
  vehicleNumber: "",
  category: "Sedan",
  fuelType: "Octane",
  seatCapacity: 4,
  partner: "",
  monthlyFixedRent: 0,
  perKmRate: 0,
  otRate: 0,
  status: "Active",
};

export default function VehiclesPage() {
  const { data: rows, loading, create, update, remove } = useCollection<Vehicle>("/api/vehicles");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Vehicle | null>(null);
  const [form, setForm] = React.useState<Omit<Vehicle, "id">>(emptyVehicle);
  const [toast, setToast] = React.useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyVehicle);
    setOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditing(v);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = v;
    setForm(rest);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setToast("Vehicle removed.");
    } catch {
      setToast("Failed to remove vehicle.");
    }
  };

  const handleSave = async () => {
    if (!form.vehicleNumber.trim() || !form.partner.trim()) {
      setToast("Vehicle number and partner are required.");
      return;
    }
    try {
      if (editing) {
        await update(editing.id, form);
        setToast("Vehicle updated.");
      } else {
        await create(form);
        setToast("Vehicle added.");
      }
      setOpen(false);
    } catch {
      setToast("Failed to save vehicle.");
    }
  };

  const columns: GridColDef<Vehicle>[] = [
    { field: "vehicleNumber", headerName: "Vehicle Number", flex: 1.4, minWidth: 200 },
    { field: "category", headerName: "Category", flex: 1, minWidth: 160 },
    { field: "fuelType", headerName: "Fuel Type", width: 100 },
    { field: "seatCapacity", headerName: "Seats", width: 80, type: "number" },
    { field: "partner", headerName: "Partner", flex: 1, minWidth: 160 },
    {
      field: "monthlyFixedRent",
      headerName: "Fixed Rent",
      width: 120,
      type: "number",
      valueFormatter: (value: number) => `৳${value.toLocaleString()}`,
    },
    {
      field: "perKmRate",
      headerName: "Per KM Rate",
      width: 110,
      type: "number",
      valueFormatter: (value: number) => `৳${value}`,
    },
    {
      field: "otRate",
      headerName: "OT Rate/hr",
      width: 110,
      type: "number",
      valueFormatter: (value: number) => `৳${value}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(params.row)}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(params.row.id)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Vehicle Master"
        subtitle="Manage the vehicle registry, categories, fuel types, and billing rates."
        breadcrumbs={[{ label: "Master Data" }, { label: "Vehicle Master" }]}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add Vehicle
          </Button>
        }
      />

      <Card>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: "none" }}
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                label="Vehicle Number"
                fullWidth
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                select
                label="Vehicle Category"
                fullWidth
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Vehicle["category"] })}
              >
                {VEHICLE_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField
                select
                label="Fuel Type"
                fullWidth
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as Vehicle["fuelType"] })}
              >
                {FUEL_TYPES.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={6}>
              <TextField
                label="Seat Capacity"
                type="number"
                fullWidth
                value={form.seatCapacity}
                onChange={(e) => setForm({ ...form, seatCapacity: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Partner / Vendor"
                fullWidth
                value={form.partner}
                onChange={(e) => setForm({ ...form, partner: e.target.value })}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Monthly Fixed Rent"
                type="number"
                fullWidth
                value={form.monthlyFixedRent}
                onChange={(e) => setForm({ ...form, monthlyFixedRent: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="Per KM Rate"
                type="number"
                fullWidth
                value={form.perKmRate}
                onChange={(e) => setForm({ ...form, perKmRate: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={4}>
              <TextField
                label="OT Rate / hr"
                type="number"
                fullWidth
                value={form.otRate}
                onChange={(e) => setForm({ ...form, otRate: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle["status"] })}
              >
                {["Active", "Inactive", "Maintenance"].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
