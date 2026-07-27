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
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { Driver } from "@/types";
import { useCollection } from "@/lib/useCollection";

const emptyDriver: Omit<Driver, "id"> = {
  name: "",
  mobile: "",
  licenseNumber: "",
  licenseAttachment: "",
  nidNumber: "",
  nidAttachment: "",
  vendor: "",
  status: "Active",
};

export default function DriversPage() {
  const { data: rows, loading, create, update, remove } = useCollection<Driver>("/api/drivers");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Driver | null>(null);
  const [form, setForm] = React.useState<Omit<Driver, "id">>(emptyDriver);
  const [toast, setToast] = React.useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyDriver);
    setOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditing(d);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = d;
    setForm(rest);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setToast("Driver removed.");
    } catch {
      setToast("Failed to remove driver.");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.mobile.trim() || !form.licenseNumber.trim() || !form.nidNumber.trim()) {
      setToast("Name, mobile, license and NID number are required.");
      return;
    }
    try {
      if (editing) {
        await update(editing.id, form);
        setToast("Driver updated.");
      } else {
        await create(form);
        setToast("Driver added.");
      }
      setOpen(false);
    } catch {
      setToast("Failed to save driver.");
    }
  };

  const columns: GridColDef<Driver>[] = [
    { field: "name", headerName: "Driver Name", flex: 1.2, minWidth: 180 },
    { field: "mobile", headerName: "Mobile Number", width: 150 },
    {
      field: "licenseNumber",
      headerName: "Driving License",
      flex: 1,
      minWidth: 170,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {params.value}
          <Tooltip title={params.row.licenseAttachment}>
            <AttachFileRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "nidNumber",
      headerName: "NID Number",
      flex: 1,
      minWidth: 170,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {params.value}
          <Tooltip title={params.row.nidAttachment}>
            <AttachFileRoundedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </Tooltip>
        </Box>
      ),
    },
    { field: "vendor", headerName: "Vendor", flex: 1, minWidth: 160 },
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
        title="Driver Master"
        subtitle="Manage driver profiles, license/NID documentation, and vendor assignment."
        breadcrumbs={[{ label: "Master Data" }, { label: "Driver Master" }]}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add Driver
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
        <DialogTitle>{editing ? "Edit Driver" : "Add Driver"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={6}>
              <TextField
                label="Driver Name"
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Mobile Number"
                fullWidth
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Driving License Number"
                fullWidth
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="License Attachment"
                fullWidth
                placeholder="filename.pdf"
                value={form.licenseAttachment}
                onChange={(e) => setForm({ ...form, licenseAttachment: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="NID Number"
                fullWidth
                value={form.nidNumber}
                onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="NID Attachment"
                fullWidth
                placeholder="filename.pdf"
                value={form.nidAttachment}
                onChange={(e) => setForm({ ...form, nidAttachment: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Vendor"
                fullWidth
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Driver["status"] })}
              >
                {["Active", "Inactive", "Suspended"].map((s) => (
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
