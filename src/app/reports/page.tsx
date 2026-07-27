"use client";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Link from "next/link";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import LocalGasStationRoundedIcon from "@mui/icons-material/LocalGasStationRounded";
import Person4RoundedIcon from "@mui/icons-material/Person4Rounded";
import PageHeader from "@/components/common/PageHeader";

const REPORTS = [
  {
    slug: "vehicle-billing",
    title: "Monthly Vehicle-wise Billing Report",
    description: "Total billed amount consolidated by vehicle.",
    icon: DirectionsCarFilledRoundedIcon,
    color: "#0f9bd7",
  },
  {
    slug: "vendor-billing",
    title: "Vendor-wise Billing Report",
    description: "Total billed amount consolidated by vendor / fleet partner.",
    icon: StorefrontRoundedIcon,
    color: "#2e7d32",
  },
  {
    slug: "department-utilization",
    title: "Department-wise Vehicle Utilization Report",
    description: "Trip count and distance travelled by requesting department.",
    icon: ApartmentRoundedIcon,
    color: "#6a1b9a",
  },
  {
    slug: "distance-travelled",
    title: "Distance Travelled Report",
    description: "Total distance travelled per vehicle.",
    icon: RouteRoundedIcon,
    color: "#0b7ca8",
  },
  {
    slug: "overtime-cost",
    title: "Overtime Cost Report",
    description: "OT hours and OT charges billed per vehicle.",
    icon: ScheduleRoundedIcon,
    color: "#ed6c02",
  },
  {
    slug: "category-cost",
    title: "Vehicle Category-wise Cost Analysis",
    description: "Total billed cost consolidated by vehicle category.",
    icon: CategoryRoundedIcon,
    color: "#1b2a4a",
  },
  {
    slug: "fuel-cost",
    title: "Fuel Type-wise Cost Analysis",
    description: "Total billed cost consolidated by vehicle fuel type.",
    icon: LocalGasStationRoundedIcon,
    color: "#d32f2f",
  },
  {
    slug: "driver-utilization",
    title: "Driver Utilization Report",
    description: "Trip count and distance driven, grouped by driver.",
    icon: Person4RoundedIcon,
    color: "#5b6b85",
  },
];

export default function ReportsHubPage() {
  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="Vehicle, vendor, department, and driver reports generated from billing and trip data. Each report supports Excel/PDF export."
      />

      <Grid container spacing={2}>
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Grid key={report.slug} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardActionArea component={Link} href={`/reports/${report.slug}`} sx={{ height: "100%", alignItems: "flex-start" }}>
                  <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%" }}>
                    <Avatar sx={{ bgcolor: report.color, width: 44, height: 44 }}>
                      <Icon />
                    </Avatar>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {report.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {report.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
