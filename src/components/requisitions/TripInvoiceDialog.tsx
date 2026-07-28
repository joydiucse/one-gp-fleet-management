"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import StatusChip from "@/components/common/StatusChip";
import { downloadTripInvoicePdf } from "@/lib/invoicePdf";
import { calculateDistanceCharge, formatBDT } from "@/lib/billing";
import type { Driver, Invoice, Requisition } from "@/types";

interface TripInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  requisition: Requisition | null;
  invoice: Invoice | undefined;
  driver: Driver | undefined;
}

export default function TripInvoiceDialog({ open, onClose, requisition, invoice, driver }: TripInvoiceDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {requisition && invoice ? (
        <TripInvoiceDialogContent
          requisition={requisition}
          invoice={invoice}
          driver={driver}
          onClose={onClose}
        />
      ) : null}
    </Dialog>
  );
}

function TripInvoiceDialogContent({
  requisition,
  invoice,
  driver,
  onClose,
}: {
  requisition: Requisition;
  invoice: Invoice;
  driver: Driver | undefined;
  onClose: () => void;
}) {
  const distanceKm = requisition.totalDistanceKm ?? 0;
  const kmRate = invoice.charges.kmRate;
  const distanceCharge = calculateDistanceCharge(distanceKm, kmRate);
  const tripInvoiceNumber = `${invoice.invoiceNumber}-${requisition.ticketId}`;

  return (
    <>
      <DialogTitle>
        Trip Invoice
        <Typography variant="body2" color="text.secondary">
          {requisition.ticketId}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Fleet Management
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trip requisition invoice
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {tripInvoiceNumber}
              </Typography>
              <StatusChip status={invoice.status} />
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Bill To
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {requisition.employeeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {requisition.department}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Trip Date
              </Typography>
              <Typography variant="body2">
                {new Date(requisition.requestDateTime).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          <Stack spacing={0.75}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Vendor
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "right" }}>
                {requisition.vendor || "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Driver
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "right" }}>
                {requisition.driverName
                  ? `${requisition.driverName}${driver?.mobile ? ` (${driver.mobile})` : ""}`
                  : "Unassigned"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Pickup
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "right", maxWidth: "65%" }}>
                {requisition.pickupLocation || "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Destination
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "right", maxWidth: "65%" }}>
                {requisition.destination || "—"}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
              borderRadius: 1.5,
              px: 2,
              py: 1.25,
            }}
          >
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Vehicle
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {requisition.vehicleNumber} — {requisition.vehicleCategory}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                Total Due (BDT)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {formatBDT(distanceCharge)}
              </Typography>
            </Box>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 0, fontWeight: 700 }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Distance
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Rate / km
                </TableCell>
                <TableCell align="right" sx={{ pr: 0, fontWeight: 700 }}>
                  Amount
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ pl: 0, border: 0 }}>Distance Charge</TableCell>
                <TableCell align="right" sx={{ border: 0 }}>
                  {distanceKm} km
                </TableCell>
                <TableCell align="right" sx={{ border: 0 }}>
                  {formatBDT(kmRate)}
                </TableCell>
                <TableCell align="right" sx={{ pr: 0, border: 0 }}>
                  {formatBDT(distanceCharge)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Divider />

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Total (BDT)
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "primary.main" }}>
              {formatBDT(distanceCharge)}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">
            Part of monthly invoice {invoice.invoiceNumber} for {invoice.vehicleNumber} ({invoice.billingMonth}) ·
            Partner: {invoice.partner}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={<DownloadRoundedIcon />}
          onClick={() =>
            downloadTripInvoicePdf({
              invoiceNumber: tripInvoiceNumber,
              ticketId: requisition.ticketId,
              employeeName: requisition.employeeName,
              department: requisition.department,
              vendor: requisition.vendor,
              tripDate: requisition.requestDateTime,
              vehicleNumber: requisition.vehicleNumber ?? "—",
              vehicleCategory: requisition.vehicleCategory ?? "—",
              driverName: requisition.driverName,
              driverMobile: driver?.mobile,
              pickupLocation: requisition.pickupLocation,
              destination: requisition.destination,
              distanceKm,
              kmRate,
              distanceCharge,
            })
          }
        >
          Download PDF
        </Button>
      </DialogActions>
    </>
  );
}
