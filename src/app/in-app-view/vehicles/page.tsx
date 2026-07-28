"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import { useAuth } from "@/store/AuthContext";
import type { Vehicle, VehicleStatus } from "@/types";

const STATUS_COLOR: Record<VehicleStatus, "success" | "warning" | "default"> = {
  Active: "success",
  Maintenance: "warning",
  Inactive: "default",
};

export default function MobileVehiclesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (!authLoading && user && user.role === "Driver") {
      router.replace("/in-app-view");
    }
  }, [authLoading, user, router]);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/vehicles", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setVehicles(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = vehicles.filter((v) => {
    if (!query) return true;
    return [v.vehicleNumber, v.category, v.fuelType, v.partner, v.status]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(query));
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Stack spacing={1.5}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search vehicle, category, fuel, partner..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")}>
                  <ClearRoundedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Stack spacing={1.25}>
      {filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          {vehicles.length === 0 ? "No vehicles found." : "No vehicles match your search."}
        </Typography>
      )}
      {filtered.map((v) => (
        <Card key={v.id}>
          <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                <LocalShippingRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {v.vehicleNumber}
                </Typography>
              </Stack>
              <Chip label={v.status} color={STATUS_COLOR[v.status]} size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
              {v.category} · {v.fuelType} · {v.seatCapacity} seats
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Partner: {v.partner}
            </Typography>
          </CardContent>
        </Card>
      ))}
      </Stack>
    </Stack>
  );
}
