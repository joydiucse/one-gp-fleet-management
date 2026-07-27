"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { Requisition, Vehicle, Driver } from "@/types";
import { useCollection } from "@/lib/useCollection";
import { RoutePickerResult } from "@/components/requisitions/RoutePickerMap";

const RoutePickerMap = dynamic(() => import("@/components/requisitions/RoutePickerMap"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 320 }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

const RoutePreviewMap = dynamic(() => import("@/components/requisitions/RoutePreviewMap"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 360 }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

const emptyForm = {
  employeeName: "",
  department: "",
  vehicleId: "",
  driverId: "",
};

function flagLabels(flags: Requisition["flags"]): string[] {
  const map: Record<keyof Requisition["flags"], string> = {
    missingStartEndTime: "Missing Start/End Time",
    missingDistance: "Missing Distance",
    vehicleDriverMismatch: "Vehicle/Driver Mismatch",
    duplicateTicketId: "Duplicate Ticket ID",
    gpsDataMissing: "GPS Data Missing",
  };
  return (Object.keys(flags) as (keyof Requisition["flags"])[]).filter((k) => flags[k]).map((k) => map[k]);
}

export default function RequisitionsPage() {
  const { data: requisitions, loading, create, update } = useCollection<Requisition>("/api/requisitions");
  const { data: vehicles } = useCollection<Vehicle>("/api/vehicles");
  const { data: drivers } = useCollection<Driver>("/api/drivers");
  const [filter, setFilter] = React.useState<string>("all");
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<Requisition | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [route, setRoute] = React.useState<RoutePickerResult | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [menuRow, setMenuRow] = React.useState<Requisition | null>(null);

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setRoute(null);
    setOpen(true);
  };

  const openEdit = (row: Requisition) => {
    const matchedVehicle = vehicles.find((v) => v.vehicleNumber === row.vehicleNumber);
    const matchedDriver = drivers.find((d) => d.name === row.driverName);
    setEditingId(row.id);
    setForm({
      employeeName: row.employeeName,
      department: row.department,
      vehicleId: matchedVehicle?.id ?? "",
      driverId: matchedDriver?.id ?? "",
    });
    setRoute({
      pickupLabel: row.pickupLocation,
      destinationLabel: row.destination,
      pickupCoords: row.pickupCoords,
      destinationCoords: row.destinationCoords,
      routePolyline: row.routePolyline,
      distanceKm: row.totalDistanceKm ?? undefined,
      durationMinutes: row.totalTravelTimeMinutes ?? undefined,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
    const selectedDriver = drivers.find((d) => d.id === form.driverId);
    if (!form.employeeName.trim() || !form.department.trim() || !selectedVehicle || !selectedDriver) {
      setToast("Employee, department, vehicle and driver are required.");
      return;
    }
    if (!route?.pickupCoords || !route?.destinationCoords) {
      setToast("Select a pickup and destination on the map.");
      return;
    }
    setSaving(true);
    try {
      const routeFields = {
        employeeName: form.employeeName,
        department: form.department,
        pickupLocation: route.pickupLabel,
        destination: route.destinationLabel,
        pickupCoords: route.pickupCoords,
        destinationCoords: route.destinationCoords,
        routePolyline: route.routePolyline,
        vehicleNumber: selectedVehicle.vehicleNumber,
        vehicleCategory: selectedVehicle.category,
        driverName: selectedDriver.name,
        totalTravelTimeMinutes: route.durationMinutes ?? null,
        totalDistanceKm: route.distanceKm ?? null,
      };
      if (editingId) {
        await update(editingId, routeFields);
        setToast("Requisition updated.");
      } else {
        await create({
          ticketId: `TRQ-${Date.now().toString().slice(-6)}`,
          requestorId: "REQ-MANUAL",
          requestDateTime: new Date().toISOString(),
          ...routeFields,
          tripStartTime: null,
          tripEndTime: null,
          tripStatus: "In Progress",
          flags: {
            missingStartEndTime: false,
            missingDistance: false,
            vehicleDriverMismatch: false,
            duplicateTicketId: false,
            gpsDataMissing: false,
          },
          billed: false,
        });
        setToast("Requisition created.");
      }
      setOpen(false);
    } catch {
      setToast(editingId ? "Failed to update requisition." : "Failed to create requisition.");
    } finally {
      setSaving(false);
    }
  };

  const handleTripStart = async (row: Requisition) => {
    setActionLoadingId(row.id);
    try {
      const updated = await update(row.id, { tripStartTime: new Date().toISOString() });
      setViewRow((v) => (v?.id === row.id ? updated : v));
      setToast("Trip started.");
    } catch {
      setToast("Failed to start trip.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTripEnd = async (row: Requisition) => {
    setActionLoadingId(row.id);
    try {
      const updated = await update(row.id, { tripEndTime: new Date().toISOString(), tripStatus: "Completed" });
      setViewRow((v) => (v?.id === row.id ? updated : v));
      setToast("Trip ended.");
    } catch {
      setToast("Failed to end trip.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelTrip = async (row: Requisition) => {
    setActionLoadingId(row.id);
    try {
      const updated = await update(row.id, { tripStatus: "Cancelled" });
      setViewRow((v) => (v?.id === row.id ? updated : v));
      setToast("Requisition cancelled.");
    } catch {
      setToast("Failed to cancel requisition.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectTrip = async (row: Requisition) => {
    setActionLoadingId(row.id);
    try {
      const updated = await update(row.id, { tripStatus: "Rejected" });
      setViewRow((v) => (v?.id === row.id ? updated : v));
      setToast("Requisition rejected.");
    } catch {
      setToast("Failed to reject requisition.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const flaggedCount = requisitions.filter((r) => Object.values(r.flags).some(Boolean)).length;
  const notBillable = requisitions.filter((r) => r.tripStatus === "Cancelled" || r.tripStatus === "Rejected").length;
  const billedCount = requisitions.filter((r) => r.billed).length;

  const sorted = [...requisitions].sort(
    (a, b) => new Date(b.requestDateTime).getTime() - new Date(a.requestDateTime).getTime()
  );

  const filtered = sorted.filter((r) => {
    if (filter === "all") return true;
    if (filter === "flagged") return Object.values(r.flags).some(Boolean);
    if (filter === "billed") return r.billed;
    if (filter === "unbilled") return !r.billed && r.tripStatus === "Completed";
    return r.tripStatus === filter;
  });

  const columns: GridColDef<Requisition>[] = [
    { field: "ticketId", headerName: "Ticket ID", width: 150 },
    { field: "employeeName", headerName: "Employee", flex: 1, minWidth: 150 },
    { field: "department", headerName: "Department", flex: 1, minWidth: 160 },
    { field: "vehicleNumber", headerName: "Vehicle", flex: 1.1, minWidth: 190 },
    { field: "driverName", headerName: "Driver", flex: 1, minWidth: 160 },
    {
      field: "totalDistanceKm",
      headerName: "Distance",
      width: 100,
      renderCell: (params) => (params.value ? `${params.value} km` : "—"),
    },
    {
      field: "totalTravelTimeMinutes",
      headerName: "Travel Time",
      width: 110,
      renderCell: (params) => (params.value ? `${Math.floor(params.value / 60)}h ${params.value % 60}m` : "—"),
    },
    {
      field: "tripStatus",
      headerName: "Trip Status",
      width: 130,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: "flags",
      headerName: "Flags",
      flex: 1.2,
      minWidth: 180,
      sortable: false,
      renderCell: (params) => {
        const labels = flagLabels(params.value);
        if (labels.length === 0) return <Typography variant="caption" color="text.secondary">—</Typography>;
        return (
          <Tooltip title={labels.join(", ")}>
            <Chip
              size="small"
              color="error"
              icon={<WarningAmberRoundedIcon />}
              label={`${labels.length} issue${labels.length > 1 ? "s" : ""}`}
            />
          </Tooltip>
        );
      },
    },
    {
      field: "billed",
      headerName: "Billed",
      width: 90,
      renderCell: (params) => (
        <Chip size="small" label={params.value ? "Yes" : "No"} color={params.value ? "success" : "default"} variant={params.value ? "filled" : "outlined"} />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 90,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => {
            setMenuAnchor(e.currentTarget);
            setMenuRow(params.row);
          }}
        >
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Trip Requisitions"
        subtitle="Trip data received from OneGP after vehicle requisition and assignment."
        action={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            New Requisition
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{requisitions.length}</Typography>
              <Typography variant="body2" color="text.secondary">Total Requisitions</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "success.main" }}>{billedCount}</Typography>
              <Typography variant="body2" color="text.secondary">Billed Trips</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "error.main" }}>{flaggedCount}</Typography>
              <Typography variant="body2" color="text.secondary">Flagged for Review</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "text.secondary" }}>{notBillable}</Typography>
              <Typography variant="body2" color="text.secondary">Cancelled / Rejected</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={filter}
          exclusive
          size="small"
          onChange={(_, v) => v && setFilter(v)}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="Completed">Completed</ToggleButton>
          <ToggleButton value="In Progress">In Progress</ToggleButton>
          <ToggleButton value="Cancelled">Cancelled</ToggleButton>
          <ToggleButton value="Rejected">Rejected</ToggleButton>
          <ToggleButton value="flagged">Flagged</ToggleButton>
          <ToggleButton value="unbilled">Unbilled</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Card>
        <DataGrid
          autoHeight
          rows={filtered}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{ border: "none" }}
        />
      </Card>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuRow) setViewRow(menuRow);
            closeMenu();
          }}
        >
          <VisibilityRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRow) openEdit(menuRow);
            closeMenu();
          }}
        >
          <EditRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Edit
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={!menuRow || menuRow.tripStatus === "Cancelled" || menuRow.tripStatus === "Rejected" || menuRow.tripStatus === "Completed"}
          onClick={() => {
            if (menuRow) handleCancelTrip(menuRow);
            closeMenu();
          }}
        >
          <CancelRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Cancel
        </MenuItem>
        <MenuItem
          disabled={!menuRow || menuRow.tripStatus === "Cancelled" || menuRow.tripStatus === "Rejected" || menuRow.tripStatus === "Completed"}
          onClick={() => {
            if (menuRow) handleRejectTrip(menuRow);
            closeMenu();
          }}
        >
          <BlockRoundedIcon fontSize="small" sx={{ mr: 1.5, color: "error.main" }} />
          Reject
        </MenuItem>
      </Menu>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Requisition" : "New Requisition"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Employee Name"
                fullWidth
                size="small"
                value={form.employeeName}
                onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
              />
              <TextField
                label="Department"
                fullWidth
                size="small"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </Stack>
            <TextField
              select
              label="Vehicle"
              fullWidth
              size="small"
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
            >
              {vehicles
                .filter((v) => v.status === "Active" || v.id === form.vehicleId)
                .map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.vehicleNumber} — {v.category}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              select
              label="Driver"
              fullWidth
              size="small"
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
            >
              {drivers
                .filter((d) => d.status === "Active" || d.id === form.driverId)
                .map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name} — {d.mobile}
                  </MenuItem>
                ))}
            </TextField>

            <RoutePickerMap
              key={editingId ?? "new"}
              initialPickupLabel={route?.pickupLabel}
              initialDestinationLabel={route?.destinationLabel}
              initialPickupCoords={route?.pickupCoords}
              initialDestinationCoords={route?.destinationCoords}
              onChange={setRoute}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Requisition" : "Create Requisition"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewRow} onClose={() => setViewRow(null)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Requisition Details
          {viewRow && (
            <Typography variant="body2" color="text.secondary">
              {viewRow.ticketId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {viewRow && (
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle2">Trip Status</Typography>
                    <StatusChip status={viewRow.tripStatus} />
                  </Box>

                  <Divider />

                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Employee</Typography>
                      <Typography variant="body2">{viewRow.employeeName}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Department</Typography>
                      <Typography variant="body2">{viewRow.department}</Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                      <Typography variant="body2">{viewRow.vehicleNumber} — {viewRow.vehicleCategory}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Driver</Typography>
                      <Typography variant="body2">{viewRow.driverName}</Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Trip Start</Typography>
                      <Typography variant="body2">
                        {viewRow.tripStartTime ? new Date(viewRow.tripStartTime).toLocaleString() : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Trip End</Typography>
                      <Typography variant="body2">
                        {viewRow.tripEndTime ? new Date(viewRow.tripEndTime).toLocaleString() : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Billed</Typography>
                      <Chip size="small" label={viewRow.billed ? "Yes" : "No"} color={viewRow.billed ? "success" : "default"} variant={viewRow.billed ? "filled" : "outlined"} />
                    </Box>
                  </Stack>

                  {flagLabels(viewRow.flags).length > 0 && (
                    <>
                      <Divider />
                      <Stack spacing={1}>
                        <Typography variant="body2" color="text.secondary">Flags</Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {flagLabels(viewRow.flags).map((label) => (
                            <Chip key={label} size="small" color="error" icon={<WarningAmberRoundedIcon />} label={label} />
                          ))}
                        </Box>
                      </Stack>
                    </>
                  )}
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <RoutePreviewMap
                  pickupLabel={viewRow.pickupLocation}
                  destinationLabel={viewRow.destination}
                  pickupCoords={viewRow.pickupCoords}
                  destinationCoords={viewRow.destinationCoords}
                  routePolyline={viewRow.routePolyline}
                  distanceKm={viewRow.totalDistanceKm}
                  durationMinutes={viewRow.totalTravelTimeMinutes}
                  height={420}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewRow(null)}>Close</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            startIcon={<EditRoundedIcon />}
            onClick={() => {
              if (viewRow) openEdit(viewRow);
              setViewRow(null);
            }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrowRoundedIcon />}
            disabled={!viewRow || actionLoadingId === viewRow.id || !!viewRow.tripStartTime}
            onClick={() => viewRow && handleTripStart(viewRow)}
          >
            Start Trip
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<StopRoundedIcon />}
            disabled={!viewRow || actionLoadingId === viewRow.id || !viewRow.tripStartTime || !!viewRow.tripEndTime}
            onClick={() => viewRow && handleTripEnd(viewRow)}
          >
            End Trip
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
