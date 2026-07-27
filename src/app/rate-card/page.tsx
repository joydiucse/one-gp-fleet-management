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
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "@/components/common/PageHeader";
import { VEHICLE_CATEGORIES, FUEL_TYPES } from "@/data/rateCards";
import { RateCard } from "@/types";
import { useCollection } from "@/lib/useCollection";

const emptyRate: Omit<RateCard, "id"> = {
  category: "Sedan",
  fuelType: "Octane",
  monthlyFixedRent: 0,
  perKmRate: 0,
  otRatePerHour: 0,
};

export default function RateCardPage() {
  const { data: rows, loading, create, update, remove } = useCollection<RateCard>("/api/rate-cards");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RateCard | null>(null);
  const [form, setForm] = React.useState<Omit<RateCard, "id">>(emptyRate);
  const [toast, setToast] = React.useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyRate);
    setOpen(true);
  };

  const openEdit = (rc: RateCard) => {
    setEditing(rc);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = rc;
    setForm(rest);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setToast("Rate card removed.");
    } catch {
      setToast("Failed to remove rate card.");
    }
  };

  const handleSave = async () => {
    const duplicate = rows.find(
      (rc) => rc.category === form.category && rc.fuelType === form.fuelType && rc.id !== editing?.id
    );
    if (duplicate) {
      setToast("A rate card for this Category + Fuel Type combination already exists.");
      return;
    }
    try {
      if (editing) {
        await update(editing.id, form);
        setToast("Rate card updated.");
      } else {
        await create(form);
        setToast("Rate card added.");
      }
      setOpen(false);
    } catch {
      setToast("Failed to save rate card.");
    }
  };

  const columns: GridColDef<RateCard>[] = [
    { field: "category", headerName: "Vehicle Category", flex: 1.2, minWidth: 190 },
    {
      field: "fuelType",
      headerName: "Fuel Type",
      width: 120,
      renderCell: (params) => <Chip size="small" label={params.value} />,
    },
    {
      field: "monthlyFixedRent",
      headerName: "Monthly Fixed Rent",
      width: 170,
      type: "number",
      valueFormatter: (value: number) => `৳${value.toLocaleString()}`,
    },
    {
      field: "perKmRate",
      headerName: "Per KM Rate",
      width: 130,
      type: "number",
      valueFormatter: (value: number) => `৳${value}`,
    },
    {
      field: "otRatePerHour",
      headerName: "OT Rate / hr",
      width: 130,
      type: "number",
      valueFormatter: (value: number) => `৳${value}`,
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
        title="Rate Card Configuration"
        subtitle="Configurable billing rates per Vehicle Category and Fuel Type combination."
        breadcrumbs={[{ label: "Master Data" }, { label: "Rate Card" }]}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add Rate Card
          </Button>
        }
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Chip label={`${VEHICLE_CATEGORIES.length} Vehicle Categories`} variant="outlined" />
        <Chip label={`${FUEL_TYPES.length} Fuel Types`} variant="outlined" />
        <Chip label={`${rows.length} Configured Rate Cards`} color="primary" variant="outlined" />
      </Stack>

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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Edit Rate Card" : "Add Rate Card"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                select
                label="Vehicle Category"
                fullWidth
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as RateCard["category"] })}
              >
                {VEHICLE_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                select
                label="Fuel Type"
                fullWidth
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as RateCard["fuelType"] })}
              >
                {FUEL_TYPES.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Monthly Fixed Rent (BDT)"
                type="number"
                fullWidth
                value={form.monthlyFixedRent}
                onChange={(e) => setForm({ ...form, monthlyFixedRent: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Per KM Rate (BDT)"
                type="number"
                fullWidth
                value={form.perKmRate}
                onChange={(e) => setForm({ ...form, perKmRate: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="OT Rate / hr (BDT)"
                type="number"
                fullWidth
                value={form.otRatePerHour}
                onChange={(e) => setForm({ ...form, otRatePerHour: Number(e.target.value) })}
              />
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
