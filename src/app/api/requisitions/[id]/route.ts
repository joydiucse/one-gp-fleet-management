import { NextRequest, NextResponse } from "next/server";
import { itemRoutes } from "@/server/crudFactory";
import { readCollection, writeCollection } from "@/server/store";
import { appendAuditLog } from "@/server/audit";
import { generateBillForCompletedTrip } from "@/server/billGenerator";
import { Requisition } from "@/types";

export const runtime = "nodejs";

const routes = itemRoutes<Requisition>({
  collection: "requisitions",
  idPrefix: "R",
  auditModule: "Trip Requisition",
  labelField: "ticketId",
});

export const GET = routes.GET;
export const DELETE = routes.DELETE;

function stripActor(body: Record<string, unknown>): { actor: string; data: Record<string, unknown> } {
  const { __actor, ...data } = body;
  return { actor: typeof __actor === "string" && __actor.trim() ? __actor : "System", data };
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;
  const { actor, data } = stripActor(body);
  const items = await readCollection<Requisition>("requisitions");
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const previous = items[idx];
  const updated = { ...previous, ...data, id } as Requisition;
  const justCompleted = updated.tripStatus === "Completed" && previous.tripStatus !== "Completed";

  items[idx] = updated;
  await writeCollection("requisitions", items);
  await appendAuditLog({
    user: actor,
    action: "Update Trip Requisition",
    module: "Trip Requisition",
    details: `Updated ${updated.ticketId}`,
  });

  if (justCompleted) {
    await generateBillForCompletedTrip(updated, actor);
  }

  return NextResponse.json(updated);
}
