"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useAuth } from "@/store/AuthContext";
import { downloadTripInvoicePdf } from "@/lib/invoicePdf";
import { calculateDistanceCharge } from "@/lib/billing";
import TripInvoiceDialog from "@/components/requisitions/TripInvoiceDialog";
import type { Driver, Invoice, Requisition, TripStatus } from "@/types";

const RoutePreviewMap = dynamic(() => import("@/components/requisitions/RoutePreviewMap"), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 260 }}>
      <CircularProgress size={24} />
    </Box>
  ),
});

const STATUS_COLOR: Record<TripStatus, "success" | "info" | "error" | "default" | "warning"> = {
  Completed: "success",
  "In Progress": "info",
  Started: "warning",
  Cancelled: "default",
  Rejected: "error",
};

function findInvoiceForRequisition(requisition: Requisition, invoices: Invoice[]): Invoice | undefined {
  if (!requisition.vehicleNumber || requisition.tripStatus !== "Completed") return undefined;
  const billingMonth = requisition.requestDateTime.slice(0, 7);
  return invoices.find((inv) => inv.vehicleNumber === requisition.vehicleNumber && inv.billingMonth === billingMonth);
}

export default function MobileRequisitionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [requisition, setRequisition] = React.useState<Requisition | null>(null);
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    const [reqRes, invRes, driverRes] = await Promise.all([
      fetch(`/api/requisitions/${params.id}`, { cache: "no-store" }),
      fetch("/api/invoices", { cache: "no-store" }),
      fetch("/api/drivers", { cache: "no-store" }),
    ]);
    if (reqRes.ok) setRequisition(await reqRes.json());
    if (invRes.ok) {
      const data = await invRes.json();
      setInvoices(Array.isArray(data) ? data : []);
    }
    if (driverRes.ok) {
      const data = await driverRes.json();
      setDrivers(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [params.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (data: Record<string, unknown>, successMessage: string) => {
    if (!requisition) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/requisitions/${requisition.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, __actor: user?.name ?? "System" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setToast(body.error ?? "Action failed.");
        return;
      }
      setRequisition(await res.json());
      setToast(successMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = () =>
    handleUpdate({ tripStartTime: new Date().toISOString(), tripStatus: "Started" }, "Trip started.");
  const handleEnd = () => {
    const tripEndTime = new Date().toISOString();
    const totalTravelTimeMinutes = requisition?.tripStartTime
      ? Math.round((new Date(tripEndTime).getTime() - new Date(requisition.tripStartTime).getTime()) / 60000)
      : requisition?.totalTravelTimeMinutes;
    return handleUpdate(
      { tripEndTime, tripStatus: "Completed", totalTravelTimeMinutes },
      "Trip ended. Invoice generated."
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!requisition) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        Trip requisition not found.
      </Typography>
    );
  }

  const invoice = findInvoiceForRequisition(requisition, invoices);

  const buildInvoiceDetails = () => {
    if (!invoice) return null;
    const distanceKm = requisition.totalDistanceKm ?? 0;
    const kmRate = invoice.charges.kmRate;
    const driver = drivers.find((d) => d.name === requisition.driverName);
    return {
      invoiceNumber: `${invoice.invoiceNumber}-${requisition.ticketId}`,
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
      distanceCharge: calculateDistanceCharge(distanceKm, kmRate),
    };
  };

  const canStart =
    !requisition.tripStartTime &&
    !!requisition.vehicleNumber &&
    !!requisition.driverName &&
    requisition.tripStatus === "In Progress";
  const canEnd =
    !!requisition.tripStartTime &&
    !requisition.tripEndTime &&
    !!requisition.vehicleNumber &&
    requisition.tripStatus === "Started";

  return (
    <Box>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {requisition.ticketId}
            </Typography>
            <Chip label={requisition.tripStatus} color={STATUS_COLOR[requisition.tripStatus]} size="small" />
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {requisition.employeeName} · {requisition.department}
          </Typography>

          <Box sx={{ mb: 1.5 }}>
            <RoutePreviewMap
              pickupLabel={requisition.pickupLocation}
              destinationLabel={requisition.destination}
              pickupCoords={requisition.pickupCoords}
              destinationCoords={requisition.destinationCoords}
              routePolyline={requisition.routePolyline}
              distanceKm={requisition.totalDistanceKm}
              durationMinutes={requisition.totalTravelTimeMinutes}
              height={240}
            />
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Stack spacing={1}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Employee</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{requisition.employeeName || "—"}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Department</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{requisition.department || "—"}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Vehicle</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{requisition.vehicleNumber ?? "Unassigned"}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Driver</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {requisition.driverName
                  ? `${requisition.driverName}${
                      drivers.find((d) => d.name === requisition.driverName)?.mobile
                        ? ` (${drivers.find((d) => d.name === requisition.driverName)?.mobile})`
                        : ""
                    }`
                  : "Unassigned"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Vendor</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{requisition.vendor ?? "—"}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Approx. Start</Typography>
              <Typography variant="body2">
                {requisition.approxTripStartTime ? new Date(requisition.approxTripStartTime).toLocaleString() : "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Approx. End</Typography>
              <Typography variant="body2">
                {requisition.approxTripEndTime ? new Date(requisition.approxTripEndTime).toLocaleString() : "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Trip Start</Typography>
              <Typography variant="body2">
                {requisition.tripStartTime ? new Date(requisition.tripStartTime).toLocaleString() : "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Trip End</Typography>
              <Typography variant="body2">
                {requisition.tripEndTime ? new Date(requisition.tripEndTime).toLocaleString() : "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">Invoiced</Typography>
              <Chip
                size="small"
                label={invoice ? invoice.invoiceNumber : "Not yet"}
                color={invoice ? "success" : "default"}
                variant={invoice ? "filled" : "outlined"}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.25}>
        <Button
          variant="contained"
          color="success"
          size="large"
          startIcon={<PlayArrowRoundedIcon />}
          disabled={!canStart || actionLoading}
          onClick={handleStart}
        >
          Start Trip
        </Button>
        <Button
          variant="contained"
          color="error"
          size="large"
          startIcon={<StopRoundedIcon />}
          disabled={!canEnd || actionLoading}
          onClick={handleEnd}
        >
          End Trip
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<VisibilityRoundedIcon />}
          disabled={!invoice}
          onClick={() => setInvoiceModalOpen(true)}
        >
          View Invoice
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<ReceiptLongRoundedIcon />}
          disabled={!invoice}
          onClick={() => {
            const details = buildInvoiceDetails();
            if (details) downloadTripInvoicePdf(details);
          }}
        >
          Download Invoice
        </Button>
      </Stack>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
      />

      <TripInvoiceDialog
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        requisition={requisition}
        invoice={invoice}
        driver={drivers.find((d) => d.name === requisition.driverName)}
      />
    </Box>
  );
}
