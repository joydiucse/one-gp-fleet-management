import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/store";
import { appendAuditLog } from "@/server/audit";
import { readRoutePolylines, writeRoutePolyline } from "@/server/routePolyline";
import { Requisition } from "@/types";

export const runtime = "nodejs";

function stripActor(body: Record<string, unknown>): { actor: string; data: Record<string, unknown> } {
  const { __actor, ...data } = body;
  return { actor: typeof __actor === "string" && __actor.trim() ? __actor : "System", data };
}

export async function GET() {
  const items = await readCollection<Requisition>("requisitions");
  const polylines = await readRoutePolylines(items.map((i) => i.id));
  const withPolylines = items.map((item) => ({
    ...item,
    routePolyline: polylines.get(item.id) ?? item.routePolyline,
  }));
  return NextResponse.json(withPolylines);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>;
  const { actor, data } = stripActor(body);
  const { routePolyline, ...rest } = data as { routePolyline?: Requisition["routePolyline"] };

  const items = await readCollection<Requisition>("requisitions");
  let maxSeq = 0;
  for (const item of items) {
    const match = /(\d+)$/.exec(item.id);
    if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
  }
  const id = `R-${String(maxSeq + 1).padStart(3, "0")}`;
  const created = { ...rest, id } as Requisition;
  items.push(created);
  await writeCollection("requisitions", items);
  await writeRoutePolyline(id, routePolyline);
  await appendAuditLog({
    user: actor,
    action: "Create Trip Requisition",
    module: "Trip Requisition",
    details: `Created ${created.ticketId}`,
  });
  return NextResponse.json({ ...created, routePolyline }, { status: 201 });
}
