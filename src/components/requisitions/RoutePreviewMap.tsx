"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import { GeoPoint } from "@/types";

import "leaflet/dist/leaflet.css";

const DHAKA_CENTER: GeoPoint = { lat: 23.7808, lng: 90.4176 };

function pinIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 16],
  });
}

const pickupIcon = pinIcon("#2e7d32");
const dropoffIcon = pinIcon("#d32f2f");

function FitBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
    } else {
      map.fitBounds(
        points.map((p) => [p.lat, p.lng]) as [number, number][],
        { padding: [40, 40] }
      );
    }
  }, [map, points]);
  return null;
}

interface RoutePreviewMapProps {
  pickupLabel: string;
  destinationLabel: string;
  pickupCoords?: GeoPoint;
  destinationCoords?: GeoPoint;
  routePolyline?: GeoPoint[];
  distanceKm?: number | null;
  durationMinutes?: number | null;
  height?: number;
}

export default function RoutePreviewMap({
  pickupLabel,
  destinationLabel,
  pickupCoords,
  destinationCoords,
  routePolyline,
  distanceKm,
  durationMinutes,
  height = 360,
}: RoutePreviewMapProps) {
  const markerPoints: GeoPoint[] = [pickupCoords, destinationCoords].filter(Boolean) as GeoPoint[];

  return (
    <Stack spacing={1.5}>
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <RadioButtonCheckedRoundedIcon sx={{ fontSize: 18, color: "success.main", mt: "2px" }} />
          <Typography variant="body2">{pickupLabel || "—"}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          <PlaceRoundedIcon sx={{ fontSize: 18, color: "error.main", mt: "2px" }} />
          <Typography variant="body2">{destinationLabel || "—"}</Typography>
        </Stack>
      </Stack>

      <Box sx={{ height, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <MapContainer
          center={[DHAKA_CENTER.lat, DHAKA_CENTER.lng]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lng]} icon={pickupIcon} />}
          {destinationCoords && <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={dropoffIcon} />}
          {routePolyline && routePolyline.length > 1 && (
            <Polyline
              positions={routePolyline.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: "#1976d2", weight: 4 }}
            />
          )}
          <FitBounds points={markerPoints} />
        </MapContainer>
      </Box>

      {(distanceKm || durationMinutes) && (
        <Stack direction="row" spacing={1}>
          {!!distanceKm && (
            <Chip size="small" icon={<StraightenRoundedIcon />} label={`${distanceKm} km`} variant="outlined" />
          )}
          {!!durationMinutes && (
            <Chip
              size="small"
              icon={<ScheduleRoundedIcon />}
              label={`${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`}
              variant="outlined"
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}
