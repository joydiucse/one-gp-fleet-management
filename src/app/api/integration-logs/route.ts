import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { toIntegrationLog } from "@/server/mappers";
import { errorResponse } from "@/server/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await prisma.integrationLog.findMany({ orderBy: { seq: "asc" } });
    return NextResponse.json(rows.map(toIntegrationLog));
  } catch (error) {
    return errorResponse(error, "Failed to load integration logs.");
  }
}
