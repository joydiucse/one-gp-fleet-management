import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/store";
import { appendAuditLog } from "@/server/audit";
import { generateBillForCompletedTrip } from "@/server/billGenerator";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { readRoutePolyline, writeRoutePolyline, deleteRoutePolyline } from "@/server/routePolyline";
import { Requisition } from "@/types";

export const runtime = "nodejs";

function stripActor(body: Record<string, unknown>): { actor: string; data: Record<string, unknown> } {
  const { __actor, ...data } = body;
  return { actor: typeof __actor === "string" && __actor.trim() ? __actor : "System", data };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const items = await readCollection<Requisition>("requisitions");
  const item = items.find((i) => i.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const routePolyline = await readRoutePolyline(id);
  return NextResponse.json({ ...item, routePolyline: routePolyline ?? item.routePolyline });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;
  const { actor, data } = stripActor(body);
  const { routePolyline: routePolylineUpdate, ...restData } = data as {
    routePolyline?: Requisition["routePolyline"];
  };
  const items = await readCollection<Requisition>("requisitions");
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const previous = items[idx];

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (session?.role === "Driver" && previous.driverName !== session.name) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = { ...previous, ...restData, id } as Requisition;
  delete updated.routePolyline;
  const justCompleted = updated.tripStatus === "Completed" && previous.tripStatus !== "Completed";

  items[idx] = updated;
  await writeCollection("requisitions", items);

  const routePolylineChanged = "routePolyline" in data;
  const routePolyline = routePolylineChanged
    ? routePolylineUpdate
    : await readRoutePolyline(id);
  if (routePolylineChanged) {
    await writeRoutePolyline(id, routePolylineUpdate);
  }

  await appendAuditLog({
    user: actor,
    action: "Update Trip Requisition",
    module: "Trip Requisition",
    details: `Updated ${updated.ticketId}`,
  });

  const responseBody = { ...updated, routePolyline };

  if (justCompleted) {
    await generateBillForCompletedTrip(responseBody as Requisition, actor);
  }

  return NextResponse.json(responseBody);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const actor = url.searchParams.get("actor") ?? "System";
  const items = await readCollection<Requisition>("requisitions");
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [removed] = items.splice(idx, 1);
  await writeCollection("requisitions", items);
  await deleteRoutePolyline(id);
  await appendAuditLog({
    user: actor,
    action: "Delete Trip Requisition",
    module: "Trip Requisition",
    details: `Deleted ${removed.ticketId}`,
  });
  return NextResponse.json({ success: true });
}
