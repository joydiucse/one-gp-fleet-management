import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog } from "@/server/audit";
import { errorResponse } from "@/server/errors";
import { requisitionRepository } from "@/server/repositories/requisitions";
import { Requisition } from "@/types";

export const runtime = "nodejs";

function stripActor(body: Record<string, unknown>): {
  actor: string;
  data: Record<string, unknown>;
} {
  const { __actor, ...data } = body;
  return { actor: typeof __actor === "string" && __actor.trim() ? __actor : "System", data };
}

export async function GET() {
  try {
    // The route geometry comes back with the trip; it is a related table rather
    // than a per-trip file read.
    return NextResponse.json(await requisitionRepository.list());
  } catch (error) {
    return errorResponse(error, "Failed to load trip requisitions.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { actor, data } = stripActor(body);
    const created: Requisition = await requisitionRepository.create(data);
    await appendAuditLog({
      user: actor,
      action: "Create Trip Requisition",
      module: "Trip Requisition",
      details: `Created ${created.ticketId}`,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create requisition.");
  }
}
