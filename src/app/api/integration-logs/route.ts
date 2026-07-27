import { NextResponse } from "next/server";
import { readCollection } from "@/server/store";
import { IntegrationLog } from "@/data/integrationLogs";

export const runtime = "nodejs";

export async function GET() {
  const logs = await readCollection<IntegrationLog>("integrationLogs");
  return NextResponse.json(logs);
}
