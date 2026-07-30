import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog } from "@/server/audit";
import { errorResponse } from "@/server/errors";
import { generateBillForCompletedTrip } from "@/server/billGenerator";
import { requisitionRepository } from "@/server/repositories/requisitions";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

function stripActor(body: Record<string, unknown>): {
  actor: string;
  data: Record<string, unknown>;
} {
  const { __actor, ...data } = body;
  return { actor: typeof __actor === "string" && __actor.trim() ? __actor : "System", data };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const item = await requisitionRepository.find(id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return errorResponse(error, "Failed to load requisition.");
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown>;
    const { actor, data } = stripActor(body);

    const previous = await requisitionRepository.find(id);
    if (!previous) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // A driver may only act on their own trips.
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? await verifySession(token) : null;
    if (session?.role === "Driver" && previous.driverName !== session.name) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await requisitionRepository.update(id, data);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const justCompleted = updated.tripStatus === "Completed" && previous.tripStatus !== "Completed";

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
  } catch (error) {
    return errorResponse(error, "Failed to update requisition.");
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const actor = new URL(req.url).searchParams.get("actor") ?? "System";
    // Route points and time extensions are removed with the trip by the
    // database's cascade rules.
    const removed = await requisitionRepository.remove(id);
    if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await appendAuditLog({
      user: actor,
      action: "Delete Trip Requisition",
      module: "Trip Requisition",
      details: `Deleted ${removed.ticketId}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, "Failed to delete requisition.");
  }
}
