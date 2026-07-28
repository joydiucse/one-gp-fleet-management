"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import AltRouteRoundedIcon from "@mui/icons-material/AltRouteRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { useAuth } from "@/store/AuthContext";
import type { Requisition, Vehicle } from "@/types";

export default function MobileHomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [requisitions, setRequisitions] = React.useState<Requisition[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [reqRes, vehRes] = await Promise.all([
          fetch("/api/requisitions", { cache: "no-store" }),
          fetch("/api/vehicles", { cache: "no-store" }),
        ]);
        const [reqData, vehData] = await Promise.all([reqRes.json(), vehRes.json()]);
        if (!cancelled) {
          setRequisitions(Array.isArray(reqData) ? reqData : []);
          setVehicles(Array.isArray(vehData) ? vehData : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDriver = user?.role === "Driver";
  const scoped = isDriver ? requisitions.filter((r) => r.driverName === user?.name) : requisitions;

  const inProgress = scoped.filter((r) => r.tripStatus === "In Progress").length;
  const completedToday = scoped.filter((r) => r.tripStatus === "Completed").length;

  const stats = [
    {
      label: "Trips In Progress",
      value: loading ? "—" : inProgress,
      icon: <PendingActionsRoundedIcon />,
      color: "warning.main",
      href: "/in-app-view/requisitions",
    },
    {
      label: "Completed Trips",
      value: loading ? "—" : completedToday,
      icon: <CheckCircleRoundedIcon />,
      color: "success.main",
      href: "/in-app-view/requisitions",
    },
    {
      label: isDriver ? "My Trips" : "Total Requisitions",
      value: loading ? "—" : scoped.length,
      icon: <AltRouteRoundedIcon />,
      color: "primary.main",
      href: "/in-app-view/requisitions",
    },
    {
      label: "Vehicles",
      value: loading ? "—" : vehicles.length,
      icon: <LocalShippingRoundedIcon />,
      color: "secondary.main",
      href: "/in-app-view/vehicles",
    },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
        Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        {user?.role ?? ""}
      </Typography>

      <Grid container spacing={1.5}>
        {stats.map((s) => (
          <Grid key={s.label} size={6}>
            <Card>
              <CardActionArea onClick={() => router.push(s.href)} sx={{ p: 1.5 }}>
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                  <Box sx={{ color: s.color, mb: 0.5 }}>{s.icon}</Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {s.label}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
