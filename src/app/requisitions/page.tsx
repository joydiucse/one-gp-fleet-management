"use client";

import * as React from "react";
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
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { Requisition } from "@/types";
import { useCollection } from "@/lib/useCollection";

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
  const { data: requisitions, loading } = useCollection<Requisition>("/api/requisitions");
  const [filter, setFilter] = React.useState<string>("all");

  const flaggedCount = requisitions.filter((r) => Object.values(r.flags).some(Boolean)).length;
  const notBillable = requisitions.filter((r) => r.tripStatus === "Cancelled" || r.tripStatus === "Rejected").length;
  const billedCount = requisitions.filter((r) => r.billed).length;

  const filtered = requisitions.filter((r) => {
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
  ];

  return (
    <Box>
      <PageHeader
        title="Trip Requisitions"
        subtitle="Trip data received from OneGP after vehicle requisition and assignment."
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
    </Box>
  );
}
