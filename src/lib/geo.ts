import { GeoPoint } from "@/types";

export interface GeoSearchResult {
  label: string;
  lat: number;
  lng: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  path: GeoPoint[];
}

// Free, no-API-key address search backed by OpenStreetMap Nominatim.
export async function searchAddress(query: string): Promise<GeoSearchResult[]> {
  if (!query.trim()) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "bd");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const results = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return results.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

// Free, no-API-key reverse geocoding backed by OpenStreetMap Nominatim.
export async function reverseGeocode(point: GeoPoint): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lng));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

// Free, no-API-key driving route + distance/duration via the public OSRM demo server.
export async function fetchRoute(from: GeoPoint, to: GeoPoint): Promise<RouteResult | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const route = data?.routes?.[0];
  if (!route) return null;
  const coordinates: [number, number][] = route.geometry.coordinates;
  return {
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMinutes: Math.round(route.duration / 60),
    path: coordinates.map(([lng, lat]) => ({ lat, lng })),
  };
}

// Haversine straight-line distance in km, used as a fallback when OSRM is unreachable.
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}
