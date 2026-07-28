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
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { alpha } from "@mui/material/styles";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { Vehicle, VehicleCategoryItem, FuelTypeItem } from "@/types";
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
  personalUsageBill: 0,
  tollCharge: 0,
  parkingCharge: 0,
  startupFuelCharge: 0,
  mobileBill: 0,
  otherCharge: 0,
  status: "Active",
};

function SectionHeader({
  icon,
  color,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  color: "primary" | "success" | "warning";
  title: string;
  subtitle: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
      <Avatar
        sx={{
          bgcolor: (theme) => alpha(theme.palette[color].main, 0.12),
          color: `${color}.main`,
          width: 36,
          height: 36,
        }}
      >
        {icon}
      </Avatar>
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function VehiclesPage() {
  const { data: rows, loading, create, update, remove } = useCollection<Vehicle>("/api/vehicles");
  const { data: categories } = useCollection<VehicleCategoryItem>("/api/vehicle-categories");
  const { data: fuelTypes } = useCollection<FuelTypeItem>("/api/fuel-types");
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

  const money = (value: number) => `৳${(value ?? 0).toLocaleString()}`;

  const columns: GridColDef<Vehicle>[] = [
    {
      field: "vehicleNumber",
      headerName: "Vehicle",
      flex: 1.2,
      minWidth: 180,
      display: "flex",
      renderCell: (params) => <Box sx={{ alignSelf: "center" }}>{params.value}</Box>,
    },
    {
      field: "vehicleInfo",
      headerName: "Category / Fuel / Seats",
      flex: 1,
      minWidth: 170,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack sx={{ py: 1 }}>
          <Typography variant="body2">{params.row.category}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.fuelType} • {params.row.seatCapacity} seats
          </Typography>
        </Stack>
      ),
    },
    { field: "partner", headerName: "Partner", flex: 1, minWidth: 150 },
    {
      field: "rates",
      headerName: "Rates",
      flex: 1,
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack sx={{ py: 1 }}>
          <Typography variant="caption">Fixed Rent: {money(params.row.monthlyFixedRent)}</Typography>
          <Typography variant="caption">Per KM: {money(params.row.perKmRate)}</Typography>
          <Typography variant="caption">OT/hr: {money(params.row.otRate)}</Typography>
        </Stack>
      ),
    },
    {
      field: "charges1",
      headerName: "Charges",
      flex: 0.9,
      minWidth: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack sx={{ py: 1 }}>
          <Typography variant="caption">Personal Usage: {money(params.row.personalUsageBill)}</Typography>
          <Typography variant="caption">Toll: {money(params.row.tollCharge)}</Typography>
          <Typography variant="caption">Parking: {money(params.row.parkingCharge)}</Typography>
        </Stack>
      ),
    },
    {
      field: "charges2",
      headerName: "Other Charges",
      flex: 0.9,
      minWidth: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Stack sx={{ py: 1 }}>
          <Typography variant="caption">Startup Fuel: {money(params.row.startupFuelCharge)}</Typography>
          <Typography variant="caption">Mobile Bill: {money(params.row.mobileBill)}</Typography>
          <Typography variant="caption">Other: {money(params.row.otherCharge)}</Typography>
        </Stack>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      display: "flex",
      renderCell: (params) => (
        <Box sx={{ alignSelf: "center" }}>
          <StatusChip status={params.value} />
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      sortable: false,
      filterable: false,
      display: "flex",
      renderCell: (params) => (
        <Box sx={{ alignSelf: "center" }}>
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
          getRowHeight={() => "auto"}
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: "none" }}
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editing ? "Edit Vehicle" : "Add Vehicle"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {editing ? "Update the vehicle registry and billing details." : "Register a new vehicle and its billing details."}
            </Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ bgcolor: "background.default" }}>
          <Card variant="outlined" sx={{ p: 2.5, mt: 2 }}>
            <SectionHeader
              icon={<DirectionsCarFilledRoundedIcon fontSize="small" />}
              color="primary"
              title="Vehicle Details"
              subtitle="Identification, category, and vendor information"
            />
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  label="Vehicle Number"
                  fullWidth
                  value={form.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Vehicle Category"
                  fullWidth
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Vehicle["category"] })}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  label="Fuel Type"
                  fullWidth
                  value={form.fuelType}
                  onChange={(e) => setForm({ ...form, fuelType: e.target.value as Vehicle["fuelType"] })}
                >
                  {fuelTypes.map((f) => (
                    <MenuItem key={f.id} value={f.name}>
                      {f.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Seat Capacity"
                  type="number"
                  fullWidth
                  value={form.seatCapacity}
                  onChange={(e) => setForm({ ...form, seatCapacity: Number(e.target.value) })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Partner / Vendor"
                  fullWidth
                  value={form.partner}
                  onChange={(e) => setForm({ ...form, partner: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
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
          </Card>

          <Card variant="outlined" sx={{ p: 2.5, mt: 2 }}>
            <SectionHeader
              icon={<PaidRoundedIcon fontSize="small" />}
              color="success"
              title="Billing Rates"
              subtitle="Standard rent and distance/overtime rates"
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Monthly Fixed Rent"
                  type="number"
                  fullWidth
                  value={form.monthlyFixedRent}
                  onChange={(e) => setForm({ ...form, monthlyFixedRent: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Per KM Rate"
                  type="number"
                  fullWidth
                  value={form.perKmRate}
                  onChange={(e) => setForm({ ...form, perKmRate: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="OT Rate / hr"
                  type="number"
                  fullWidth
                  value={form.otRate}
                  onChange={(e) => setForm({ ...form, otRate: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
            </Grid>
          </Card>

          <Card variant="outlined" sx={{ p: 2.5, mt: 2 }}>
            <SectionHeader
              icon={<ReceiptLongRoundedIcon fontSize="small" />}
              color="warning"
              title="Additional Charges"
              subtitle="Recurring monthly charges billed alongside the fixed rent"
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Personal Usage Bill"
                  type="number"
                  fullWidth
                  value={form.personalUsageBill}
                  onChange={(e) => setForm({ ...form, personalUsageBill: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Toll Charge"
                  type="number"
                  fullWidth
                  value={form.tollCharge}
                  onChange={(e) => setForm({ ...form, tollCharge: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Parking Charge"
                  type="number"
                  fullWidth
                  value={form.parkingCharge}
                  onChange={(e) => setForm({ ...form, parkingCharge: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Startup Fuel Charge"
                  type="number"
                  fullWidth
                  value={form.startupFuelCharge}
                  onChange={(e) => setForm({ ...form, startupFuelCharge: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Mobile Bill"
                  type="number"
                  fullWidth
                  value={form.mobileBill}
                  onChange={(e) => setForm({ ...form, mobileBill: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Other Charge"
                  type="number"
                  fullWidth
                  value={form.otherCharge}
                  onChange={(e) => setForm({ ...form, otherCharge: Number(e.target.value) })}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">৳</InputAdornment> } }}
                />
              </Grid>
            </Grid>
          </Card>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2 }}>
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
