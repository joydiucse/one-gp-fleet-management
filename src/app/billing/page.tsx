"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Link from "next/link";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { useInvoiceStore } from "@/store/InvoiceStore";
import { Invoice } from "@/types";
import { formatBDT } from "@/lib/billing";

export default function BillingPage() {
  const { invoices, loading } = useInvoiceStore();
  const [month, setMonth] = React.useState("all");
  const [toast, setToast] = React.useState<string | null>(null);

  const months = Array.from(new Set(invoices.map((i) => i.billingMonth))).sort().reverse();
  const filtered = month === "all" ? invoices : invoices.filter((i) => i.billingMonth === month);

  const totalAmount = filtered.reduce((sum, i) => sum + i.totalBill, 0);
  const paidAmount = filtered.filter((i) => i.status === "Paid").reduce((sum, i) => sum + i.totalBill, 0);
  const pendingAmount = filtered
    .filter((i) => i.status === "Pending Approval" || i.status === "Draft")
    .reduce((sum, i) => sum + i.totalBill, 0);

  const columns: GridColDef<Invoice>[] = [
    {
      field: "invoiceNumber",
      headerName: "Invoice Number",
      flex: 1.2,
      minWidth: 200,
      renderCell: (params) => <Link href={`/billing/${params.row.id}`}>{params.value}</Link>,
    },
    { field: "vehicleNumber", headerName: "Vehicle", flex: 1.1, minWidth: 190 },
    { field: "partner", headerName: "Partner / Vendor", flex: 1, minWidth: 160 },
    { field: "billingMonth", headerName: "Billing Month", width: 120 },
    { field: "tripCount", headerName: "Trips", width: 80, type: "number" },
    {
      field: "totalBill",
      headerName: "Total Bill",
      width: 140,
      type: "number",
      valueFormatter: (value: number) => formatBDT(value),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Billing & Invoices"
        subtitle="Monthly vehicle invoices consolidated from approved trips, fixed rent, OT, toll, parking and other charges."
        action={
          <Button
            variant="contained"
            startIcon={<ReceiptLongRoundedIcon />}
            onClick={() => setToast("Bill generation triggered. New draft invoices will be created for completed, unbilled trips.")}
          >
            Generate Monthly Bills
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatBDT(totalAmount)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Invoiced</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "success.main" }}>{formatBDT(paidAmount)}</Typography>
              <Typography variant="body2" color="text.secondary">Paid</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "warning.main" }}>{formatBDT(pendingAmount)}</Typography>
              <Typography variant="body2" color="text.secondary">Pending / Draft</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2, maxWidth: 220 }}>
        <TextField select size="small" label="Billing Month" fullWidth value={month} onChange={(e) => setMonth(e.target.value)}>
          <MenuItem value="all">All Months</MenuItem>
          {months.map((m) => (
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

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        <Alert severity="info" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
