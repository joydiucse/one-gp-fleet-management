"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import Person4RoundedIcon from "@mui/icons-material/Person4Rounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import StatusChip from "@/components/common/StatusChip";
import { useCollection } from "@/lib/useCollection";
import { useInvoiceStore } from "@/store/InvoiceStore";
import { Vehicle, Driver, Requisition } from "@/types";
import { formatBDT } from "@/lib/billing";

export default function DashboardPage() {
  const { data: vehicles, loading: vehiclesLoading } = useCollection<Vehicle>("/api/vehicles");
  const { data: drivers, loading: driversLoading } = useCollection<Driver>("/api/drivers");
  const { data: requisitions, loading: requisitionsLoading } = useCollection<Requisition>("/api/requisitions");
  const { invoices, loading: invoicesLoading } = useInvoiceStore();

  const isLoading = vehiclesLoading || driversLoading || requisitionsLoading || invoicesLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <Typography color="text.secondary">Loading dashboard…</Typography>
      </Box>
    );
  }

  const activeVehicles = vehicles.filter((v) => v.status === "Active").length;
  const activeDrivers = drivers.filter((d) => d.status === "Active").length;
  const tripsThisMonth = requisitions.filter((r) => r.requestDateTime.startsWith("2026-06")).length;
  const pendingInvoices = invoices.filter((i) => i.status === "Pending Approval" || i.status === "Draft").length;
  const totalBilledThisMonth = invoices
    .filter((i) => i.billingMonth === "2026-06")
    .reduce((sum, i) => sum + i.totalBill, 0);
  const flaggedTrips = requisitions.filter((r) =>
    Object.values(r.flags).some(Boolean)
  ).length;

  const categoryTotals = new Map<string, number>();
  invoices.forEach((inv) => {
    categoryTotals.set(inv.vehicleCategory, (categoryTotals.get(inv.vehicleCategory) ?? 0) + inv.totalBill);
  });
  const categoryLabels = Array.from(categoryTotals.keys());
  const categoryValues = Array.from(categoryTotals.values());

  const fuelTotals = new Map<string, number>();
  vehicles.forEach((v) => {
    fuelTotals.set(v.fuelType, (fuelTotals.get(v.fuelType) ?? 0) + 1);
  });
  const fuelPieData = Array.from(fuelTotals.entries()).map(([label, value], idx) => ({
    id: idx,
    label,
    value,
  }));

  const recentRequisitions = [...requisitions]
    .sort((a, b) => (a.requestDateTime < b.requestDateTime ? 1 : -1))
    .slice(0, 6);

  const recentInvoices = [...invoices]
    .sort((a, b) => (a.generatedDate < b.generatedDate ? 1 : -1))
    .slice(0, 5);

  return (
    <Box>
      <PageHeader
        title="Fleet Billing Overview"
        subtitle="Automated billing generated from OneGP trip requisitions and vehicle master data."
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard label="Total Vehicles" value={vehicles.length} icon={DirectionsCarFilledRoundedIcon} color="#0f9bd7" helperText={`${activeVehicles} active`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard label="Active Drivers" value={activeDrivers} icon={Person4RoundedIcon} color="#1b2a4a" helperText={`${drivers.length} total`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard label="Trips (June)" value={tripsThisMonth} icon={AssignmentTurnedInRoundedIcon} color="#2e7d32" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard label="Pending Invoices" value={pendingInvoices} icon={ReceiptLongRoundedIcon} color="#ed6c02" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard label="Billed (June)" value={formatBDT(totalBilledThisMonth)} icon={PaidRoundedIcon} color="#0b7ca8" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
          <StatCard label="Flagged Trips" value={flaggedTrips} icon={WarningAmberRoundedIcon} color="#d32f2f" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Vehicle Category-wise Billed Amount
              </Typography>
              <BarChart
                height={300}
                xAxis={[{ data: categoryLabels, scaleType: "band" }]}
                series={[{ data: categoryValues, label: "Total Billed (BDT)", color: "#0f9bd7" }]}
                margin={{ left: 70 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Fleet by Fuel Type
              </Typography>
              <PieChart
                height={300}
                series={[{ data: fuelPieData, innerRadius: 50, paddingAngle: 2 }]}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Recent Trip Requisitions
                </Typography>
                <Button size="small" component={Link} href="/requisitions">
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticket ID</TableCell>
                      <TableCell>Employee</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Distance</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentRequisitions.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell>{r.ticketId}</TableCell>
                        <TableCell>{r.employeeName}</TableCell>
                        <TableCell>{r.vehicleNumber}</TableCell>
                        <TableCell>{r.totalDistanceKm ? `${r.totalDistanceKm} km` : "—"}</TableCell>
                        <TableCell>
                          <StatusChip status={r.tripStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Recent Invoices
                </Typography>
                <Button size="small" component={Link} href="/billing">
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentInvoices.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell>
                          <Link href={`/billing/${inv.id}`}>{inv.invoiceNumber}</Link>
                        </TableCell>
                        <TableCell>{inv.vehicleNumber}</TableCell>
                        <TableCell>{formatBDT(inv.totalBill)}</TableCell>
                        <TableCell>
                          <StatusChip status={inv.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
