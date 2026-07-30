import { NextResponse } from "next/server";
import { readAuditLogs } from "@/server/audit";
import { errorResponse } from "@/server/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await readAuditLogs());
  } catch (error) {
    return errorResponse(error, "Failed to load audit logs.");
  }
}
