"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
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
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import { useAuth } from "@/store/AuthContext";
import type { Requisition, TripStatus } from "@/types";

const STATUS_COLOR: Record<TripStatus, "success" | "info" | "error" | "default" | "warning"> = {
  Completed: "success",
  "In Progress": "info",
  Started: "warning",
  Cancelled: "default",
  Rejected: "error",
};

const STATUS_FILTERS: Array<{ label: string; value: TripStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "In Progress" },
  { label: "Started", value: "Started" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Rejected", value: "Rejected" },
];

export default function MobileRequisitionsPage() {
  return (
    <Suspense fallback={null}>
      <MobileRequisitionsView />
    </Suspense>
  );
}

function MobileRequisitionsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [requisitions, setRequisitions] = React.useState<Requisition[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const initialStatus = searchParams.get("status");
  const [statusFilter, setStatusFilter] = React.useState<TripStatus | "all">(
    STATUS_FILTERS.some((f) => f.value === initialStatus) ? (initialStatus as TripStatus | "all") : "all"
  );

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/requisitions", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRequisitions(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isDriver = user?.role === "Driver";
  const scoped = isDriver ? requisitions.filter((r) => r.driverName === user?.name) : requisitions;

  const query = search.trim().toLowerCase();
  const filtered = scoped.filter((r) => {
    if (statusFilter !== "all" && r.tripStatus !== statusFilter) return false;
    if (!query) return true;
    return [r.ticketId, r.employeeName, r.department, r.pickupLocation, r.destination, r.vehicleNumber, r.driverName]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(query));
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.requestDateTime).getTime() - new Date(a.requestDateTime).getTime()
  );

  return (
    <Stack spacing={1.5}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search ticket, employee, route, vehicle..."
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

      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          overflowX: "auto",
          pb: 0.5,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            size="small"
            onClick={() => setStatusFilter(f.value)}
            color={statusFilter === f.value ? "primary" : "default"}
            variant={statusFilter === f.value ? "filled" : "outlined"}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <Stack spacing={1.25}>
          {sorted.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              {scoped.length === 0
                ? isDriver
                  ? "No trips assigned to you yet."
                  : "No trip requisitions found."
                : "No trips match your search."}
            </Typography>
          )}
          {sorted.map((r) => (
            <Card key={r.id}>
              <CardActionArea onClick={() => router.push(`/in-app-view/requisitions/${r.id}`)}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {r.ticketId}
                    </Typography>
                    <Chip label={r.tripStatus} color={STATUS_COLOR[r.tripStatus]} size="small" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                    {r.employeeName} · {r.department}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.secondary", mb: 0.25 }}>
                    <PlaceRoundedIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.pickupLocation} → {r.destination}
                    </Typography>
                  </Stack>
                  <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      {r.vehicleNumber ?? "Unassigned"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(r.requestDateTime).toLocaleString()}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
