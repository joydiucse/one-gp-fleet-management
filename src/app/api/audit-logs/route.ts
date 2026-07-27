import { NextResponse } from "next/server";
import { readCollection } from "@/server/store";
import { AuditLog } from "@/types";

export const runtime = "nodejs";

export async function GET() {
  const logs = await readCollection<AuditLog>("auditLogs");
  return NextResponse.json(logs);
}
