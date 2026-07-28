"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
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
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import MoreTimeRoundedIcon from "@mui/icons-material/MoreTimeRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import DoNotDisturbAltRoundedIcon from "@mui/icons-material/DoNotDisturbAltRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import TripInvoiceDialog from "@/components/requisitions/TripInvoiceDialog";
import { Requisition, Vehicle, Driver, Invoice } from "@/types";
import { useCollection } from "@/lib/useCollection";
import { useInvoiceStore } from "@/store/InvoiceStore";
import { useAuth } from "@/store/AuthContext";
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
  vendor: "",
  approxTripStartTime: "",
  approxTripEndTime: "",
};

function approxDurationLabel(start: string, end: string): string | null {
  if (!start || !end) return null;
  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

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

function findInvoiceForRequisition(requisition: Requisition, invoices: Invoice[]): Invoice | undefined {
  if (!requisition.vehicleNumber || requisition.tripStatus !== "Completed") return undefined;
  const billingMonth = requisition.requestDateTime.slice(0, 7);
  return invoices.find((inv) => inv.vehicleNumber === requisition.vehicleNumber && inv.billingMonth === billingMonth);
}

export default function RequisitionsPage() {
  const { user } = useAuth();
  const { data: requisitions, loading, create, update } = useCollection<Requisition>("/api/requisitions");
  const { data: vehicles } = useCollection<Vehicle>("/api/vehicles");
  const { data: drivers } = useCollection<Driver>("/api/drivers");
  const { invoices } = useInvoiceStore();
  const [filter, setFilter] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
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
  const [assignRow, setAssignRow] = React.useState<Requisition | null>(null);
  const [assignForm, setAssignForm] = React.useState({ vehicleId: "", driverId: "" });
  const [extendRow, setExtendRow] = React.useState<Requisition | null>(null);
  const [extendEndTime, setExtendEndTime] = React.useState("");
  const [extendNote, setExtendNote] = React.useState("");
  const [invoiceViewRow, setInvoiceViewRow] = React.useState<Requisition | null>(null);

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const openAssign = (row: Requisition) => {
    setAssignRow(row);
    setAssignForm({
      vehicleId: vehicles.find((v) => v.vehicleNumber === row.vehicleNumber)?.id ?? "",
      driverId: drivers.find((d) => d.name === row.driverName)?.id ?? "",
    });
  };

  const handleAssignSave = async () => {
    if (!assignRow) return;
    const selectedVehicle = vehicles.find((v) => v.id === assignForm.vehicleId);
    const selectedDriver = drivers.find((d) => d.id === assignForm.driverId);
    if (!selectedVehicle) {
      setToast("Select a vehicle to assign.");
      return;
    }
    setSaving(true);
    try {
      await update(assignRow.id, {
        vehicleNumber: selectedVehicle.vehicleNumber,
        vehicleCategory: selectedVehicle.category,
        driverName: selectedDriver?.name,
      });
      setToast("Vehicle assigned.");
      setAssignRow(null);
    } catch {
      setToast("Failed to assign vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const openExtend = (row: Requisition) => {
    setExtendRow(row);
    setExtendNote("");
    const base = row.tripEndTime ?? row.approxTripEndTime ?? new Date().toISOString();
    setExtendEndTime(base.slice(0, 16));
  };

  const handleExtendSave = async () => {
    if (!extendRow || !extendEndTime || !extendNote.trim()) {
      setToast("A reason is required to extend the trip time.");
      return;
    }
    const previousEndTime = extendRow.tripEndTime;
    const newEndTime = new Date(extendEndTime).toISOString();
    const minutes = extendRow.tripStartTime
      ? Math.round((new Date(newEndTime).getTime() - new Date(extendRow.tripStartTime).getTime()) / 60000)
      : extendRow.totalTravelTimeMinutes;
    const extension = {
      extendedAt: new Date().toISOString(),
      previousEndTime,
      newEndTime,
      note: extendNote.trim(),
      extendedBy: user?.name ?? "System",
    };
    setActionLoadingId(extendRow.id);
    try {
      const updated = await update(extendRow.id, {
        tripEndTime: newEndTime,
        totalTravelTimeMinutes: minutes,
        timeExtensions: [...(extendRow.timeExtensions ?? []), extension],
      });
      setViewRow((v) => (v?.id === extendRow.id ? updated : v));
      setToast("Trip time extended.");
      setExtendRow(null);
    } catch {
      setToast("Failed to extend trip time.");
    } finally {
      setActionLoadingId(null);
    }
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
      vendor: row.vendor ?? "",
      approxTripStartTime: row.approxTripStartTime ? row.approxTripStartTime.slice(0, 16) : "",
      approxTripEndTime: row.approxTripEndTime ? row.approxTripEndTime.slice(0, 16) : "",
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
    if (!form.employeeName.trim() || !form.department.trim()) {
      setToast("Employee and department are required.");
      return;
    }
    if (!route?.pickupCoords || !route?.destinationCoords) {
      setToast("Select a pickup and destination on the map.");
      return;
    }
    if (!form.approxTripStartTime || !form.approxTripEndTime) {
      setToast("Approximate trip start and end time are required.");
      return;
    }
    if (new Date(form.approxTripEndTime).getTime() <= new Date(form.approxTripStartTime).getTime()) {
      setToast("Approximate trip end time must be after the start time.");
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
        vehicleNumber: selectedVehicle?.vehicleNumber,
        vehicleCategory: selectedVehicle?.category,
        driverName: selectedDriver?.name,
        vendor: form.vendor || undefined,
        totalTravelTimeMinutes: Math.round(
          (new Date(form.approxTripEndTime).getTime() - new Date(form.approxTripStartTime).getTime()) / 60000
        ),
        totalDistanceKm: route.distanceKm ?? null,
        approxTripStartTime: new Date(form.approxTripStartTime).toISOString(),
        approxTripEndTime: new Date(form.approxTripEndTime).toISOString(),
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
    if (!row.vehicleNumber || !row.driverName) {
      setToast("Assign a vehicle and driver before starting the trip.");
      return;
    }
    setActionLoadingId(row.id);
    try {
      const updated = await update(row.id, { tripStartTime: new Date().toISOString(), tripStatus: "Started" });
      setViewRow((v) => (v?.id === row.id ? updated : v));
      setToast("Trip started.");
    } catch {
      setToast("Failed to start trip.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTripEnd = async (row: Requisition) => {
    if (!row.vehicleNumber) {
      setToast("Assign a vehicle before ending the trip.");
      return;
    }
    setActionLoadingId(row.id);
    try {
      const tripEndTime = new Date().toISOString();
      const totalTravelTimeMinutes = row.tripStartTime
        ? Math.round((new Date(tripEndTime).getTime() - new Date(row.tripStartTime).getTime()) / 60000)
        : row.totalTravelTimeMinutes;
      const updated = await update(row.id, { tripEndTime, tripStatus: "Completed", totalTravelTimeMinutes });
      setViewRow((v) => (v?.id === row.id ? updated : v));
      setToast("Trip ended. Invoice generated.");
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
  const invoicedCount = requisitions.filter((r) => findInvoiceForRequisition(r, invoices)).length;

  const sorted = [...requisitions].sort(
    (a, b) => new Date(b.requestDateTime).getTime() - new Date(a.requestDateTime).getTime()
  );

  const filtered = sorted.filter((r) => {
    if (filter === "flagged" && !Object.values(r.flags).some(Boolean)) return false;
    if (filter === "invoiced" && !findInvoiceForRequisition(r, invoices)) return false;
    if (filter === "uninvoiced" && (findInvoiceForRequisition(r, invoices) || r.tripStatus !== "Completed")) return false;
    if (!["all", "flagged", "invoiced", "uninvoiced"].includes(filter) && r.tripStatus !== filter) return false;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [r.ticketId, r.employeeName, r.department, r.vehicleNumber, r.driverName, r.vendor]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  const columns: GridColDef<Requisition>[] = [
    {
      field: "ticketId",
      headerName: "Requisition Id",
      width: 150,
      renderCell: (params) => (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
            {!!params.row.timeExtensions?.length && (
              <Tooltip title="Trip time was extended — see details for reason.">
                <MoreTimeRoundedIcon fontSize="small" color="warning" />
              </Tooltip>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            Added {new Date(params.row.requestDateTime).toLocaleString()}
          </Typography>
        </Box>
      ),
    },
    {
      field: "employeeName",
      headerName: "Employee",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.department}
            {params.row.vendor ? ` • ${params.row.vendor}` : ""}
          </Typography>
        </Box>
      ),
    },
    {
      field: "vehicleNumber",
      headerName: "Vehicle",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => {
        if (!params.value) return <Chip size="small" label="Unassigned" variant="outlined" />;
        const vehicle = vehicles.find((v) => v.vehicleNumber === params.value);
        return (
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.vehicleCategory || vehicle?.category || "—"}
              {vehicle ? ` • ৳${vehicle.perKmRate}/km` : ""}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "driverName",
      headerName: "Driver",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => {
        if (!params.value) return <Chip size="small" label="Unassigned" variant="outlined" />;
        const driver = drivers.find((d) => d.name === params.value);
        return (
          <Box>
            <Typography variant="body2">{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {driver?.mobile || "—"}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: "totalDistanceKm",
      headerName: "Distance / Time",
      width: 120,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">{params.value ? `${params.value} km` : "—"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.totalTravelTimeMinutes
              ? `${Math.floor(params.row.totalTravelTimeMinutes / 60)}h ${params.row.totalTravelTimeMinutes % 60}m`
              : "—"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "approxTripStartTime",
      headerName: "Approx. Start / End",
      width: 170,
      renderCell: (params) => (
        <Box>
          <Typography variant="caption" component="div" color="text.secondary">
            Start: {params.value ? new Date(params.value).toLocaleString() : "—"}
          </Typography>
          <Typography variant="caption" component="div" color="text.secondary">
            End: {params.row.approxTripEndTime ? new Date(params.row.approxTripEndTime).toLocaleString() : "—"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "tripStartTime",
      headerName: "Actual Start / End",
      width: 170,
      renderCell: (params) => (
        <Box>
          <Typography variant="caption" component="div" color="text.secondary">
            Start: {params.value ? new Date(params.value).toLocaleString() : "—"}
          </Typography>
          <Typography variant="caption" component="div" color="text.secondary">
            End: {params.row.tripEndTime ? new Date(params.row.tripEndTime).toLocaleString() : "—"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "tripStatus",
      headerName: "Trip Status",
      width: 130,
      renderCell: (params) => <StatusChip status={params.value} />,
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
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  color: "primary.main",
                  flexShrink: 0,
                }}
              >
                <AssignmentRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{requisitions.length}</Typography>
                <Typography variant="caption" color="text.secondary">Total Requisitions</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.success.main, 0.12),
                  color: "success.main",
                  flexShrink: 0,
                }}
              >
                <TaskAltRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: "success.main" }}>{invoicedCount}</Typography>
                <Typography variant="caption" color="text.secondary">Invoiced Trips</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.error.main, 0.12),
                  color: "error.main",
                  flexShrink: 0,
                }}
              >
                <FlagRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: "error.main" }}>{flaggedCount}</Typography>
                <Typography variant="caption" color="text.secondary">Flagged for Review</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: "action.hover",
                  color: "text.secondary",
                  flexShrink: 0,
                }}
              >
                <DoNotDisturbAltRoundedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: "text.secondary" }}>{notBillable}</Typography>
                <Typography variant="caption" color="text.secondary">Cancelled / Rejected</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by requisition id, employee, vehicle, driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 320 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="requisition-status-filter-label">Status</InputLabel>
          <Select
            labelId="requisition-status-filter-label"
            label="Status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
            <MenuItem value="flagged">Flagged</MenuItem>
            <MenuItem value="uninvoiced">Uninvoiced</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Card>
        <DataGrid
          autoHeight
          getRowHeight={() => "auto"}
          rows={filtered}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10, 25, 50]}
          sx={{
            border: "none",
            "& .MuiDataGrid-cell": { py: 1, alignItems: "center" },
          }}
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
          disabled={!menuRow || menuRow.tripStatus === "Completed" || menuRow.tripStatus === "Cancelled" || menuRow.tripStatus === "Rejected"}
          onClick={() => {
            if (menuRow) openEdit(menuRow);
            closeMenu();
          }}
        >
          <EditRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Edit
        </MenuItem>
        <MenuItem
          disabled={!menuRow || menuRow.tripStatus !== "In Progress"}
          onClick={() => {
            if (menuRow) openAssign(menuRow);
            closeMenu();
          }}
        >
          <DirectionsCarRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          {menuRow?.vehicleNumber ? "Reassign Vehicle" : "Assign Vehicle"}
        </MenuItem>
        <MenuItem
          disabled={!menuRow || menuRow.tripStatus !== "In Progress"}
          onClick={() => {
            if (menuRow) openAssign(menuRow);
            closeMenu();
          }}
        >
          <DirectionsCarRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          {menuRow?.driverName ? "Reassign Driver" : "Assign Driver"}
        </MenuItem>
        <MenuItem
          disabled={!menuRow || !menuRow.vehicleNumber || !menuRow.driverName || !!menuRow.tripStartTime || menuRow.tripStatus === "Cancelled" || menuRow.tripStatus === "Rejected"}
          onClick={() => {
            if (menuRow) handleTripStart(menuRow);
            closeMenu();
          }}
        >
          <PlayArrowRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Start Trip
        </MenuItem>
        <MenuItem
          disabled={
            !menuRow ||
            !menuRow.vehicleNumber ||
            !menuRow.tripStartTime ||
            !!menuRow.tripEndTime ||
            menuRow.tripStatus === "Cancelled" ||
            menuRow.tripStatus === "Rejected"
          }
          onClick={() => {
            if (menuRow) handleTripEnd(menuRow);
            closeMenu();
          }}
        >
          <StopRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          End Trip
        </MenuItem>
        <MenuItem
          disabled={
            !menuRow ||
            !menuRow.tripStartTime ||
            !!menuRow.tripEndTime ||
            menuRow.tripStatus === "Cancelled" ||
            menuRow.tripStatus === "Rejected"
          }
          onClick={() => {
            if (menuRow) openExtend(menuRow);
            closeMenu();
          }}
        >
          <MoreTimeRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Extend Time
        </MenuItem>
        <MenuItem
          disabled={!menuRow || !findInvoiceForRequisition(menuRow, invoices)}
          onClick={() => {
            if (menuRow) setInvoiceViewRow(menuRow);
            closeMenu();
          }}
        >
          <ReceiptLongRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          View Invoice
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

      <Dialog open={!!assignRow} onClose={() => setAssignRow(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Assign Vehicle &amp; Driver
          {assignRow && (
            <Typography variant="body2" color="text.secondary">
              {assignRow.ticketId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              select
              label="Vehicle"
              fullWidth
              size="small"
              value={assignForm.vehicleId}
              onChange={(e) => setAssignForm({ ...assignForm, vehicleId: e.target.value })}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {vehicles
                .filter((v) => v.status === "Active" || v.id === assignForm.vehicleId)
                .map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.vehicleNumber} — {v.category}
                  </MenuItem>
                ))}
            </TextField>

            {(() => {
              const selectedVehicle = vehicles.find((v) => v.id === assignForm.vehicleId);
              if (!selectedVehicle) return null;
              return (
                <Card variant="outlined" sx={{ bgcolor: "action.hover" }}>
                  <CardContent sx={{ py: 0.75, px: 1.25, "&:last-child": { pb: 0.75 } }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <DirectionsCarRoundedIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {selectedVehicle.vehicleNumber}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                      {selectedVehicle.category} • {selectedVehicle.fuelType} • {selectedVehicle.seatCapacity} seats
                      {" • "}
                      {selectedVehicle.partner} • ৳{selectedVehicle.perKmRate}/km
                    </Typography>
                  </CardContent>
                </Card>
              );
            })()}

            <TextField
              select
              label="Driver"
              fullWidth
              size="small"
              value={assignForm.driverId}
              onChange={(e) => setAssignForm({ ...assignForm, driverId: e.target.value })}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {drivers
                .filter((d) => d.status === "Active" || d.id === assignForm.driverId)
                .map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name} — {d.mobile}
                  </MenuItem>
                ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="error" onClick={() => setAssignRow(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignSave} disabled={saving}>
            {saving ? "Saving..." : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!extendRow} onClose={() => setExtendRow(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Extend Trip Time
          {extendRow && (
            <Typography variant="body2" color="text.secondary">
              {extendRow.ticketId}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="New Trip End Time"
              type="datetime-local"
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={extendEndTime}
              onChange={(e) => setExtendEndTime(e.target.value)}
            />
            <TextField
              label="Reason for Extension (required)"
              fullWidth
              multiline
              minRows={2}
              size="small"
              value={extendNote}
              onChange={(e) => setExtendNote(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setExtendRow(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleExtendSave}
            disabled={actionLoadingId === extendRow?.id || !extendNote.trim()}
          >
            {actionLoadingId === extendRow?.id ? "Saving..." : "Extend"}
          </Button>
        </DialogActions>
      </Dialog>

      {(() => {
        const editingRow = editingId ? requisitions.find((r) => r.id === editingId) : null;
        const assignmentLocked = !!editingRow && (editingRow.tripStatus === "Started" || !!editingRow.tripStartTime);
        return (
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: { sx: { minHeight: { md: "82vh" } } } }}
      >
        <DialogTitle>{editingId ? "Edit Requisition" : "New Requisition"}</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <RoutePickerMap
            key={editingId ?? "new"}
            initialPickupLabel={route?.pickupLabel}
            initialDestinationLabel={route?.destinationLabel}
            initialPickupCoords={route?.pickupCoords}
            initialDestinationCoords={route?.destinationCoords}
            onChange={setRoute}
            mapHeight={440}
            leftColumnExtra={
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Trip Details
                </Typography>
                <TextField
                  select
                  label="Vehicle (optional)"
                  helperText={
                    assignmentLocked
                      ? "Trip already started — vehicle can no longer be reassigned."
                      : "Leave unassigned to assign a vehicle later from the list."
                  }
                  disabled={assignmentLocked}
                  fullWidth
                  size="small"
                  value={form.vehicleId}
                  onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {vehicles
                    .filter((v) => v.status === "Active" || v.id === form.vehicleId)
                    .map((v) => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.vehicleNumber} — {v.category}
                      </MenuItem>
                    ))}
                </TextField>

                {(() => {
                  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
                  if (!selectedVehicle) return null;
                  return (
                    <Card variant="outlined" sx={{ bgcolor: "action.hover" }}>
                      <CardContent sx={{ py: 0.75, px: 1.25, "&:last-child": { pb: 0.75 } }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <DirectionsCarRoundedIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {selectedVehicle.vehicleNumber}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                          {selectedVehicle.category} • {selectedVehicle.fuelType} • {selectedVehicle.seatCapacity} seats
                          {" • "}
                          {selectedVehicle.partner} • ৳{selectedVehicle.perKmRate}/km
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })()}

                <TextField
                  select
                  label="Driver (optional)"
                  helperText={assignmentLocked ? "Trip already started — driver can no longer be reassigned." : undefined}
                  disabled={assignmentLocked}
                  fullWidth
                  size="small"
                  value={form.driverId}
                  onChange={(e) => setForm({ ...form, driverId: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {drivers
                    .filter((d) => d.status === "Active" || d.id === form.driverId)
                    .map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.name} — {d.mobile}
                      </MenuItem>
                    ))}
                </TextField>

                <Divider />

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
                  label="Vendor (optional)"
                  fullWidth
                  size="small"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                />

                <Divider />

                <Typography variant="subtitle2" color="text.secondary">
                  Approximate Trip Time
                </Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Approx. Start Time"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={form.approxTripStartTime}
                    onChange={(e) => setForm({ ...form, approxTripStartTime: e.target.value })}
                  />
                  <TextField
                    label="Approx. End Time"
                    type="datetime-local"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={form.approxTripEndTime}
                    onChange={(e) => setForm({ ...form, approxTripEndTime: e.target.value })}
                  />
                </Stack>
                {(() => {
                  const duration = approxDurationLabel(form.approxTripStartTime, form.approxTripEndTime);
                  if (!duration) return null;
                  return (
                    <Chip
                      size="small"
                      icon={<ScheduleRoundedIcon />}
                      label={`Approx. Duration: ${duration}`}
                      variant="outlined"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  );
                })()}
              </Stack>
            }
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="error" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Requisition" : "Create Requisition"}
          </Button>
        </DialogActions>
      </Dialog>
        );
      })()}

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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {viewRow.ticketId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Added {new Date(viewRow.requestDateTime).toLocaleString()}
                      </Typography>
                    </Box>
                    <StatusChip status={viewRow.tripStatus} />
                  </Box>

                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                      Requisition
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Employee</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewRow.employeeName}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Department</Typography>
                      <Typography variant="body2">{viewRow.department}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Vendor</Typography>
                      <Typography variant="body2">{viewRow.vendor || "—"}</Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                      Assignment
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Vehicle</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {viewRow.vehicleNumber ? `${viewRow.vehicleNumber} — ${viewRow.vehicleCategory}` : "Unassigned"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Driver</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {viewRow.driverName
                          ? `${viewRow.driverName}${
                              drivers.find((d) => d.name === viewRow.driverName)?.mobile
                                ? ` (${drivers.find((d) => d.name === viewRow.driverName)?.mobile})`
                                : ""
                            }`
                          : "Unassigned"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                      Approximate Trip Time
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Approx. Start</Typography>
                      <Typography variant="body2">
                        {viewRow.approxTripStartTime ? new Date(viewRow.approxTripStartTime).toLocaleString() : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Approx. End</Typography>
                      <Typography variant="body2">
                        {viewRow.approxTripEndTime ? new Date(viewRow.approxTripEndTime).toLocaleString() : "—"}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                      Trip Timeline
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">Trip Start</Typography>
                      <Typography variant="body2">
                        {viewRow.tripStartTime ? new Date(viewRow.tripStartTime).toLocaleString() : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Trip End</Typography>
                      <Typography variant="body2">
                        {viewRow.tripEndTime ? new Date(viewRow.tripEndTime).toLocaleString() : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Distance</Typography>
                      <Typography variant="body2">
                        {viewRow.totalDistanceKm ? `${viewRow.totalDistanceKm} km` : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Travel Time</Typography>
                      <Typography variant="body2">
                        {viewRow.totalTravelTimeMinutes
                          ? `${Math.floor(viewRow.totalTravelTimeMinutes / 60)}h ${viewRow.totalTravelTimeMinutes % 60}m`
                          : "—"}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">Invoiced</Typography>
                      {(() => {
                        const invoice = findInvoiceForRequisition(viewRow, invoices);
                        return (
                          <Chip
                            size="small"
                            label={invoice ? invoice.invoiceNumber : "No"}
                            color={invoice ? "success" : "default"}
                            variant={invoice ? "filled" : "outlined"}
                          />
                        );
                      })()}
                    </Box>
                  </Stack>

                  {!!viewRow.timeExtensions?.length && (
                    <>
                      <Divider />
                      <Stack spacing={1}>
                        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                          Time Extension
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {viewRow.timeExtensions.map((ext, idx) => (
                            <Tooltip
                              key={idx}
                              title={
                                <>
                                  <div>Extended at {new Date(ext.extendedAt).toLocaleString()} by {ext.extendedBy}</div>
                                  <div>New end time: {new Date(ext.newEndTime).toLocaleString()}</div>
                                  <div>Note: {ext.note}</div>
                                </>
                              }
                            >
                              <Chip
                                size="small"
                                color="warning"
                                icon={<MoreTimeRoundedIcon />}
                                label={`Extended ${new Date(ext.extendedAt).toLocaleString()}`}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </Stack>
                    </>
                  )}

                  {flagLabels(viewRow.flags).length > 0 && (
                    <>
                      <Divider />
                      <Stack spacing={1}>
                        <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                          Flags
                        </Typography>
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
          <Button color="error" onClick={() => setViewRow(null)}>Close</Button>
          <Box sx={{ flex: 1 }} />
          <Button
            startIcon={<EditRoundedIcon />}
            disabled={
              !viewRow ||
              viewRow.tripStatus === "Completed" ||
              viewRow.tripStatus === "Cancelled" ||
              viewRow.tripStatus === "Rejected"
            }
            onClick={() => {
              if (viewRow) openEdit(viewRow);
              setViewRow(null);
            }}
          >
            Edit
          </Button>
          {viewRow && findInvoiceForRequisition(viewRow, invoices) && (
            <Button
              startIcon={<ReceiptLongRoundedIcon />}
              onClick={() => setInvoiceViewRow(viewRow)}
            >
              View Invoice
            </Button>
          )}
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrowRoundedIcon />}
            disabled={
              !viewRow ||
              actionLoadingId === viewRow.id ||
              !!viewRow.tripStartTime ||
              !viewRow.vehicleNumber ||
              !viewRow.driverName
            }
            onClick={() => viewRow && handleTripStart(viewRow)}
          >
            Start Trip
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<StopRoundedIcon />}
            disabled={
              !viewRow ||
              actionLoadingId === viewRow.id ||
              !viewRow.tripStartTime ||
              !!viewRow.tripEndTime ||
              !viewRow.vehicleNumber
            }
            onClick={() => viewRow && handleTripEnd(viewRow)}
          >
            End Trip
          </Button>
        </DialogActions>
      </Dialog>

      <TripInvoiceDialog
        open={!!invoiceViewRow}
        onClose={() => setInvoiceViewRow(null)}
        requisition={invoiceViewRow}
        invoice={invoiceViewRow ? findInvoiceForRequisition(invoiceViewRow, invoices) : undefined}
        driver={drivers.find((d) => d.name === invoiceViewRow?.driverName)}
      />

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)}>
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
