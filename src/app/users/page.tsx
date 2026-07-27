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
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { AppUser, UserRole } from "@/types";
import { useCollection } from "@/lib/useCollection";

const ROLES: UserRole[] = ["Fleet Administrator", "Billing Administrator", "Finance", "Approver", "Read Only"];

const roleColor: Record<UserRole, string> = {
  "Fleet Administrator": "#0f9bd7",
  "Billing Administrator": "#2e7d32",
  Finance: "#ed6c02",
  Approver: "#6a1b9a",
  "Read Only": "#5b6b85",
};

const emptyUser: Omit<AppUser, "id" | "lastLogin"> & { password: string } = {
  name: "",
  email: "",
  role: "Read Only",
  status: "Active",
  password: "",
};

export default function UsersPage() {
  const { data: rows, loading, create, update, remove } = useCollection<AppUser>("/api/users");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AppUser | null>(null);
  const [form, setForm] = React.useState<Omit<AppUser, "id" | "lastLogin"> & { password: string }>(emptyUser);
  const [toast, setToast] = React.useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyUser);
    setOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status, password: "" });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setToast("User removed.");
    } catch {
      setToast("Failed to remove user.");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setToast("Name and email are required.");
      return;
    }
    if (!editing && !form.password.trim()) {
      setToast("A password is required for new users.");
      return;
    }
    try {
      if (editing) {
        await update(editing.id, form);
        setToast("User updated.");
      } else {
        await create(form);
        setToast("User added.");
      }
      setOpen(false);
    } catch {
      setToast("Failed to save user.");
    }
  };

  const columns: GridColDef<AppUser>[] = [
    { field: "name", headerName: "Name", flex: 1, minWidth: 170 },
    { field: "email", headerName: "Email", flex: 1.3, minWidth: 220 },
    {
      field: "role",
      headerName: "Role",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Chip size="small" label={params.value} sx={{ bgcolor: roleColor[params.value as UserRole], color: "#fff" }} />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    { field: "lastLogin", headerName: "Last Login", flex: 1, minWidth: 170, valueFormatter: (v: string) => (v === "—" ? v : new Date(v).toLocaleString()) },
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
        title="Users & Roles"
        subtitle="Role-Based Access Control (RBAC): Fleet Administrator, Billing Administrator, Finance, Approver, Read Only."
        breadcrumbs={[{ label: "Administration" }, { label: "Users & Roles" }]}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add User
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

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                label="Full Name"
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Email"
                fullWidth
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label={editing ? "New Password (leave blank to keep current)" : "Password"}
                type="password"
                fullWidth
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                select
                label="Role"
                fullWidth
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as AppUser["status"] })}
              >
                {["Active", "Inactive"].map((s) => (
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
