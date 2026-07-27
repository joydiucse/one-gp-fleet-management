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
import { useCollection } from "@/lib/useCollection";

interface NamedItem {
  id: string;
  name: string;
}

export default function NamedListPage({
  endpoint,
  title,
  subtitle,
  itemLabel,
  breadcrumbLabel,
}: {
  endpoint: string;
  title: string;
  subtitle: string;
  itemLabel: string;
  breadcrumbLabel: string;
}) {
  const { data: rows, loading, create, update, remove } = useCollection<NamedItem>(endpoint);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<NamedItem | null>(null);
  const [name, setName] = React.useState("");
  const [toast, setToast] = React.useState<string | null>(null);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setOpen(true);
  };

  const openEdit = (row: NamedItem) => {
    setEditing(row);
    setName(row.name);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      setToast(`${itemLabel} removed.`);
    } catch {
      setToast(`Failed to remove ${itemLabel.toLowerCase()}.`);
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setToast(`${itemLabel} name is required.`);
      return;
    }
    const duplicate = rows.find(
      (r) => r.name.toLowerCase() === trimmed.toLowerCase() && r.id !== editing?.id
    );
    if (duplicate) {
      setToast(`This ${itemLabel.toLowerCase()} already exists.`);
      return;
    }
    try {
      if (editing) {
        await update(editing.id, { name: trimmed });
        setToast(`${itemLabel} updated.`);
      } else {
        await create({ name: trimmed });
        setToast(`${itemLabel} added.`);
      }
      setOpen(false);
    } catch {
      setToast(`Failed to save ${itemLabel.toLowerCase()}.`);
    }
  };

  const columns: GridColDef<NamedItem>[] = [
    { field: "name", headerName: itemLabel, flex: 1, minWidth: 220 },
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
        title={title}
        subtitle={subtitle}
        breadcrumbs={[{ label: "Master Data" }, { label: breadcrumbLabel }]}
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            Add {itemLabel}
          </Button>
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip label={`${rows.length} ${itemLabel}${rows.length === 1 ? "" : "s"}`} color="primary" variant="outlined" />
      </Box>

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
        <DialogTitle>{editing ? `Edit ${itemLabel}` : `Add ${itemLabel}`}</DialogTitle>
        <DialogContent>
          <TextField
            label={itemLabel}
            fullWidth
            autoFocus
            sx={{ mt: 0.5 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
