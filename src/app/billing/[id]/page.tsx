"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import StatusChip from "@/components/common/StatusChip";
import { useInvoiceStore } from "@/store/InvoiceStore";
import { formatBDT } from "@/lib/billing";

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { invoices, loading, updateStatus, addAdjustment } = useInvoiceStore();
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustNote, setAdjustNote] = React.useState("");
  const [adjustAmount, setAdjustAmount] = React.useState(0);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const invoice = invoices.find((i) => i.id === params.id);

  if (loading) {
    return (
      <Box>
        <Typography color="text.secondary">Loading invoice…</Typography>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box>
        <Alert severity="error">Invoice not found.</Alert>
        <Button sx={{ mt: 2 }} onClick={() => router.push("/billing")}>Back to Billing</Button>
      </Box>
    );
  }

  const rows: [string, number][] = [
    ["Monthly Fixed Vehicle Rent (Body Rent)", invoice.charges.fixedRent],
    ["Personal Usage Bill", invoice.charges.personalUsageBill],
    [`Distance Charge (${invoice.charges.distanceKm} km × ${formatBDT(invoice.charges.kmRate)})`, invoice.charges.distanceCharge],
    [`Overtime Charge (${invoice.charges.otHours} hrs)`, invoice.charges.otCharge],
    ["Toll Charge", invoice.charges.tollCharge],
    ["Parking Charge", invoice.charges.parkingCharge],
    ["Startup Fuel Charge", invoice.charges.startupFuelCharge],
    ["Mobile Bill", invoice.charges.mobileBill],
    ["Other Approved Charges", invoice.charges.otherCharges],
  ];

  const handleAdjustSave = async () => {
    if (!adjustNote.trim() || adjustAmount === 0) return;
    try {
      await addAdjustment(invoice.id, adjustNote, adjustAmount);
      setAdjustOpen(false);
      setAdjustNote("");
      setAdjustAmount(0);
      setActionError(null);
    } catch {
      setActionError("Failed to apply adjustment.");
    }
  };

  const handleStatusChange = async (status: Parameters<typeof updateStatus>[1], note?: string) => {
    try {
      await updateStatus(invoice.id, status, note);
      setActionError(null);
    } catch {
      setActionError("Failed to update invoice status.");
    }
  };

  return (
    <Box>
      <PageHeader
        title={invoice.invoiceNumber}
        subtitle={`Billing month ${invoice.billingMonth} · ${invoice.vehicleNumber}`}
        breadcrumbs={[{ label: "Billing & Invoices", href: "/billing" }, { label: invoice.invoiceNumber }]}
        action={
          <Stack direction="row" spacing={1}>
            <Button startIcon={<ArrowBackRoundedIcon />} component={Link} href="/billing">
              Back
            </Button>
            <Button startIcon={<PrintRoundedIcon />} onClick={() => window.print()}>
              Print
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Charge Breakdown
                </Typography>
                <StatusChip status={invoice.status} />
              </Box>
              <Table size="small">
                <TableBody>
                  {rows.map(([label, amount]) => (
                    <TableRow key={label}>
                      <TableCell sx={{ border: 0 }}>{label}</TableCell>
                      <TableCell align="right" sx={{ border: 0 }}>{formatBDT(amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Total Bill</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                  {formatBDT(invoice.totalBill)}
                </Typography>
              </Box>
              {invoice.adjustmentNote && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {invoice.adjustmentNote}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Invoice Details
              </Typography>
              <Stack spacing={1}>
                <Detail label="Vehicle Category" value={invoice.vehicleCategory} />
                <Detail label="Partner / Vendor" value={invoice.partner} />
                <Detail label="Trip Count" value={String(invoice.tripCount)} />
                <Detail label="Generated Date" value={new Date(invoice.generatedDate).toLocaleString()} />
                <Detail label="Approved By" value={invoice.approvedBy ?? "—"} />
                <Detail label="Approved Date" value={invoice.approvedDate ? new Date(invoice.approvedDate).toLocaleString() : "—"} />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                Actions
              </Typography>
              {actionError && (
                <Alert severity="error" sx={{ mb: 1.5 }}>
                  {actionError}
                </Alert>
              )}
              <Stack spacing={1}>
                {invoice.status === "Draft" && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="warning"
                    onClick={() => handleStatusChange("Pending Approval")}
                  >
                    Submit for Approval
                  </Button>
                )}
                {invoice.status === "Pending Approval" && (
                  <>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleRoundedIcon />}
                      onClick={() => handleStatusChange("Approved")}
                    >
                      Approve Invoice
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<CancelRoundedIcon />}
                      onClick={() => handleStatusChange("Rejected", "Rejected by Finance for review.")}
                    >
                      Reject Invoice
                    </Button>
                  </>
                )}
                {invoice.status === "Approved" && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<PaidRoundedIcon />}
                    onClick={() => handleStatusChange("Paid")}
                  >
                    Mark as Paid
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditNoteRoundedIcon />}
                  onClick={() => setAdjustOpen(true)}
                >
                  Manual Adjustment
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Manual Billing Adjustment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All manual adjustments are recorded in the audit log with mandatory notes.
          </Typography>
          <TextField
            label="Adjustment Amount (BDT, use negative to deduct)"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(Number(e.target.value))}
          />
          <TextField
            label="Reason / Note (required)"
            fullWidth
            multiline
            minRows={3}
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdjustSave} disabled={!adjustNote.trim() || adjustAmount === 0}>
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "right" }}>{value}</Typography>
    </Box>
  );
}
