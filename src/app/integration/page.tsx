"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { IntegrationLog } from "@/data/integrationLogs";
import { useCollection } from "@/lib/useCollection";

export default function IntegrationPage() {
  const { data: integrationLogs, loading } = useCollection<IntegrationLog>("/api/integration-logs");
  const inbound = integrationLogs.filter((l) => l.direction === "Inbound").length;
  const outbound = integrationLogs.filter((l) => l.direction === "Outbound").length;
  const failed = integrationLogs.filter((l) => l.status === "Failed" || l.status === "Retried").length;

  const columns: GridColDef<IntegrationLog>[] = [
    { field: "timestamp", headerName: "Timestamp", width: 170, valueFormatter: (v: string) => new Date(v).toLocaleString() },
    {
      field: "direction",
      headerName: "Direction",
      width: 120,
      renderCell: (params) => (
        <Chip
          size="small"
          icon={params.value === "Inbound" ? <ArrowDownwardRoundedIcon /> : <ArrowUpwardRoundedIcon />}
          label={params.value}
          color={params.value === "Inbound" ? "info" : "secondary"}
          variant="outlined"
        />
      ),
    },
    { field: "payloadType", headerName: "Payload Type", flex: 1, minWidth: 190 },
    { field: "referenceId", headerName: "Reference ID", flex: 1, minWidth: 170 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => <StatusChip status={params.value === "Retried" ? "Pending Approval" : params.value === "Success" ? "Completed" : "Rejected"} />,
    },
    { field: "message", headerName: "Message", flex: 2, minWidth: 280 },
  ];

  return (
    <Box>
      <PageHeader
        title="OneGP Integration Logs"
        subtitle="API-based REST/JSON transaction logs between OneGP and the Fleet Management System."
        breadcrumbs={[{ label: "Administration" }, { label: "Integration Logs" }]}
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ArrowDownwardRoundedIcon color="info" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{inbound}</Typography>
                <Typography variant="body2" color="text.secondary">Inbound (OneGP → Fleet)</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <ArrowUpwardRoundedIcon color="secondary" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{outbound}</Typography>
                <Typography variant="body2" color="text.secondary">Outbound (Fleet → OneGP)</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <SyncRoundedIcon color="error" />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{failed}</Typography>
                <Typography variant="body2" color="text.secondary">Failed / Retried</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <DataGrid
          autoHeight
          rows={integrationLogs}
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
