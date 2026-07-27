"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import { GeoPoint } from "@/types";
import { searchAddress, fetchRoute, haversineKm, reverseGeocode, GeoSearchResult } from "@/lib/geo";

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

function MapClickHandler({ onPick }: { onPick: (point: GeoPoint) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

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

interface LocationFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onValueChange: (v: string) => void;
  onSelect: (result: GeoSearchResult) => void;
  onFocus?: () => void;
}

function LocationField({ label, icon, value, onValueChange, onSelect, onFocus }: LocationFieldProps) {
  const [options, setOptions] = React.useState<GeoSearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (v: string) => {
    onValueChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v.trim()) {
      setOptions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results = await searchAddress(v);
      setOptions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 400);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <TextField
        label={label}
        fullWidth
        size="small"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          onFocus?.();
          if (options.length > 0) setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        slotProps={{
          input: {
            startAdornment: icon,
            endAdornment: loading ? <CircularProgress size={16} /> : null,
          },
        }}
      />
      {open && options.length > 0 && (
        <Paper
          sx={{
            position: "absolute",
            zIndex: 1300,
            mt: 0.5,
            width: "100%",
            maxHeight: 220,
            overflowY: "auto",
          }}
          elevation={4}
        >
          {options.map((opt, i) => (
            <MenuItem
              key={i}
              onMouseDown={() => {
                onSelect(opt);
                setOpen(false);
              }}
              sx={{ whiteSpace: "normal", fontSize: 13 }}
            >
              {opt.label}
            </MenuItem>
          ))}
        </Paper>
      )}
    </Box>
  );
}

export interface RoutePickerResult {
  pickupLabel: string;
  destinationLabel: string;
  pickupCoords?: GeoPoint;
  destinationCoords?: GeoPoint;
  routePolyline?: GeoPoint[];
  distanceKm?: number;
  durationMinutes?: number;
}

interface RoutePickerMapProps {
  initialPickupLabel?: string;
  initialDestinationLabel?: string;
  initialPickupCoords?: GeoPoint;
  initialDestinationCoords?: GeoPoint;
  onChange: (result: RoutePickerResult) => void;
}

export default function RoutePickerMap({
  initialPickupLabel = "",
  initialDestinationLabel = "",
  initialPickupCoords,
  initialDestinationCoords,
  onChange,
}: RoutePickerMapProps) {
  const [pickupLabel, setPickupLabel] = React.useState(initialPickupLabel);
  const [destinationLabel, setDestinationLabel] = React.useState(initialDestinationLabel);
  const [pickupCoords, setPickupCoords] = React.useState<GeoPoint | undefined>(initialPickupCoords);
  const [destinationCoords, setDestinationCoords] = React.useState<GeoPoint | undefined>(initialDestinationCoords);
  const [activeField, setActiveField] = React.useState<"pickup" | "destination">("pickup");
  const [geocoding, setGeocoding] = React.useState(false);
  const [routing, setRouting] = React.useState(false);
  const [route, setRoute] = React.useState<{ distanceKm: number; durationMinutes: number; path: GeoPoint[] } | null>(
    null
  );

  const emit = React.useCallback(
    (
      pLabel: string,
      dLabel: string,
      pCoords?: GeoPoint,
      dCoords?: GeoPoint,
      r?: { distanceKm: number; durationMinutes: number; path: GeoPoint[] } | null
    ) => {
      onChange({
        pickupLabel: pLabel,
        destinationLabel: dLabel,
        pickupCoords: pCoords,
        destinationCoords: dCoords,
        routePolyline: r?.path,
        distanceKm: r?.distanceKm,
        durationMinutes: r?.durationMinutes,
      });
    },
    [onChange]
  );

  React.useEffect(() => {
    let cancelled = false;
    async function computeRoute() {
      if (!pickupCoords || !destinationCoords) {
        setRoute(null);
        emit(pickupLabel, destinationLabel, pickupCoords, destinationCoords, null);
        return;
      }
      setRouting(true);
      const result = await fetchRoute(pickupCoords, destinationCoords);
      if (cancelled) return;
      if (result) {
        setRoute(result);
        emit(pickupLabel, destinationLabel, pickupCoords, destinationCoords, result);
      } else {
        const fallback = {
          distanceKm: haversineKm(pickupCoords, destinationCoords),
          durationMinutes: 0,
          path: [pickupCoords, destinationCoords],
        };
        setRoute(fallback);
        emit(pickupLabel, destinationLabel, pickupCoords, destinationCoords, fallback);
      }
      setRouting(false);
    }
    computeRoute();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupCoords, destinationCoords]);

  const markerPoints: GeoPoint[] = [pickupCoords, destinationCoords].filter(Boolean) as GeoPoint[];

  const handleMapPick = React.useCallback(
    async (point: GeoPoint) => {
      setGeocoding(true);
      const label = await reverseGeocode(point);
      setGeocoding(false);
      if (activeField === "pickup") {
        setPickupLabel(label);
        setPickupCoords(point);
        if (!destinationCoords) setActiveField("destination");
      } else {
        setDestinationLabel(label);
        setDestinationCoords(point);
      }
    },
    [activeField, destinationCoords]
  );

  return (
    <Stack spacing={1.5}>
      <LocationField
        label="Pickup Location"
        icon={<RadioButtonCheckedRoundedIcon sx={{ fontSize: 18, color: "success.main", mr: 1 }} />}
        value={pickupLabel}
        onFocus={() => setActiveField("pickup")}
        onValueChange={(v) => {
          setPickupLabel(v);
          emit(v, destinationLabel, undefined, destinationCoords, null);
          setPickupCoords(undefined);
        }}
        onSelect={(opt) => {
          setPickupLabel(opt.label);
          setPickupCoords({ lat: opt.lat, lng: opt.lng });
        }}
      />
      <LocationField
        label="Destination"
        icon={<PlaceRoundedIcon sx={{ fontSize: 18, color: "error.main", mr: 1 }} />}
        value={destinationLabel}
        onFocus={() => setActiveField("destination")}
        onValueChange={(v) => {
          setDestinationLabel(v);
          emit(pickupLabel, v, pickupCoords, undefined, null);
          setDestinationCoords(undefined);
        }}
        onSelect={(opt) => {
          setDestinationLabel(opt.label);
          setDestinationCoords({ lat: opt.lat, lng: opt.lng });
        }}
      />

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Click map to set:
        </Typography>
        <ToggleButtonGroup
          value={activeField}
          exclusive
          size="small"
          onChange={(_, v) => v && setActiveField(v)}
        >
          <ToggleButton value="pickup" sx={{ py: 0.25 }}>
            Pickup
          </ToggleButton>
          <ToggleButton value="destination" sx={{ py: 0.25 }}>
            Destination
          </ToggleButton>
        </ToggleButtonGroup>
        {geocoding && <CircularProgress size={14} />}
      </Stack>

      <Box sx={{ height: 320, borderRadius: 1.5, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
        <MapContainer
          center={[DHAKA_CENTER.lat, DHAKA_CENTER.lng]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={handleMapPick} />
          {pickupCoords && (
            <Marker
              position={[pickupCoords.lat, pickupCoords.lng]}
              icon={pickupIcon}
              draggable
              eventHandlers={{
                dragend: async (e) => {
                  const m = e.target.getLatLng();
                  const point = { lat: m.lat, lng: m.lng };
                  setPickupCoords(point);
                  setPickupLabel(await reverseGeocode(point));
                },
              }}
            />
          )}
          {destinationCoords && (
            <Marker
              position={[destinationCoords.lat, destinationCoords.lng]}
              icon={dropoffIcon}
              draggable
              eventHandlers={{
                dragend: async (e) => {
                  const m = e.target.getLatLng();
                  const point = { lat: m.lat, lng: m.lng };
                  setDestinationCoords(point);
                  setDestinationLabel(await reverseGeocode(point));
                },
              }}
            />
          )}
          {route && route.path.length > 1 && (
            <Polyline positions={route.path.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#1976d2", weight: 4 }} />
          )}
          <FitBounds points={markerPoints} />
        </MapContainer>
      </Box>

      {(routing || route) && (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          {routing && <CircularProgress size={16} />}
          {route && !routing && (
            <>
              <Chip
                size="small"
                icon={<StraightenRoundedIcon />}
                label={`${route.distanceKm} km`}
                variant="outlined"
              />
              {route.durationMinutes > 0 && (
                <Chip
                  size="small"
                  icon={<ScheduleRoundedIcon />}
                  label={`${Math.floor(route.durationMinutes / 60)}h ${route.durationMinutes % 60}m`}
                  variant="outlined"
                />
              )}
            </>
          )}
          {!route && !routing && (
            <Typography variant="caption" color="text.secondary">
              Select pickup and destination to preview the route.
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}
