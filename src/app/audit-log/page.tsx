"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import PageHeader from "@/components/common/PageHeader";
import { AuditLog } from "@/types";
import { useCollection } from "@/lib/useCollection";

const MODULE_COLORS: Record<string, string> = {
  Billing: "#0f9bd7",
  "Vehicle Master": "#2e7d32",
  "Driver Master": "#6a1b9a",
  "Rate Card": "#ed6c02",
  "User Management": "#5b6b85",
  "OneGP Integration": "#0b7ca8",
};

export default function AuditLogPage() {
  const { data: auditLogs, loading, refresh } = useCollection<AuditLog>("/api/audit-logs");
  const [module, setModule] = React.useState("all");

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));
  const filtered = module === "all" ? auditLogs : auditLogs.filter((l) => l.module === module);

  const columns: GridColDef<AuditLog>[] = [
    {
      field: "timestamp",
      headerName: "Timestamp",
      width: 180,
      valueFormatter: (v: string) => new Date(v).toLocaleString(),
    },
    { field: "user", headerName: "User", flex: 1, minWidth: 160 },
    { field: "action", headerName: "Action", flex: 1, minWidth: 160 },
    {
      field: "module",
      headerName: "Module",
      width: 170,
      renderCell: (params) => (
        <Chip size="small" label={params.value} sx={{ bgcolor: MODULE_COLORS[params.value] ?? "#5b6b85", color: "#fff" }} />
      ),
    },
    { field: "details", headerName: "Details", flex: 2, minWidth: 280 },
  ];

  return (
    <Box>
      <PageHeader
        title="Audit Log"
        subtitle="Audit trail for bill generation, approvals, manual adjustments, master data changes, user activity, and API transactions."
        action={
          <Button startIcon={<RefreshRoundedIcon />} onClick={() => refresh()}>
            Refresh
          </Button>
        }
      />

      <Box sx={{ mb: 2, maxWidth: 240 }}>
        <TextField select size="small" label="Module" fullWidth value={module} onChange={(e) => setModule(e.target.value)}>
          <MenuItem value="all">All Modules</MenuItem>
          {modules.map((m) => (
            <MenuItem key={m} value={m}>{m}</MenuItem>
          ))}
        </TextField>
      </Box>

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
