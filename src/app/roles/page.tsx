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
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { Role } from "@/types";
import { useCollection } from "@/lib/useCollection";
import { PERMISSION_MODULES } from "@/lib/permissions";

const emptyRole: Omit<Role, "id"> = {
  name: "",
  description: "",
  permissions: [],
  status: "Active",
};

const UNGROUPED = "General";

function groupModules() {
  const groups = new Map<string, typeof PERMISSION_MODULES>();
  for (const mod of PERMISSION_MODULES) {
    const key = mod.group ?? UNGROUPED;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(mod);
  }
  return groups;
}

export default function RolesPage() {
  const { data: rows, loading, create, update, remove } = useCollection<Role>("/api/roles");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Role | null>(null);
  const [form, setForm] = React.useState<Omit<Role, "id">>(emptyRole);
  const [toast, setToast] = React.useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyRole);
    setOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditing(r);
    setForm({ name: r.name, description: r.description ?? "", permissions: r.permissions, status: r.status });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setToast("Role removed.");
    } catch {
      setToast("Failed to remove role.");
    }
  };

  const togglePermission = (key: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setToast("Role name is required.");
      return;
    }
    try {
      if (editing) {
        await update(editing.id, form);
        setToast("Role updated.");
      } else {
        await create(form);
        setToast("Role added.");
      }
      setOpen(false);
    } catch {
      setToast("Failed to save role.");
    }
  };

  const columns: GridColDef<Role>[] = [
    { field: "name", headerName: "Role Name", flex: 1, minWidth: 190 },
    { field: "description", headerName: "Description", flex: 1.4, minWidth: 240 },
    {
      field: "permissions",
      headerName: "Permissions",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Chip size="small" label={`${params.value.length} of ${PERMISSION_MODULES.length}`} />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
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

  const groups = groupModules();

  return (
    <Box>
      <PageHeader
        title="Roles"
        subtitle="Define roles and the menus/pages each role is permitted to access."
        breadcrumbs={[{ label: "Administration" }, { label: "Roles" }]}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add Role
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
        <DialogTitle>{editing ? "Edit Role" : "Add Role"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                label="Role Name"
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Description"
                fullWidth
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                select
                label="Status"
                fullWidth
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Role["status"] })}
              >
                {["Active", "Inactive"].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Menu & Page Permissions
              </Typography>
              {Array.from(groups.entries()).map(([group, modules]) => (
                <Box key={group} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    {group}
                  </Typography>
                  <Grid container>
                    {modules.map((mod) => (
                      <Grid size={6} key={mod.key}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={form.permissions.includes(mod.key)}
                              onChange={() => togglePermission(mod.key)}
                            />
                          }
                          label={mod.label}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
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
