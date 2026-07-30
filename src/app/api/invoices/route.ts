import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog } from "@/server/audit";
import { errorResponse } from "@/server/errors";
import { invoiceRepository } from "@/server/repositories/invoices";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await invoiceRepository.list());
  } catch (error) {
    return errorResponse(error, "Failed to load invoices.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown> & { __actor?: string };
    const { __actor, ...data } = body;
    const created = await invoiceRepository.create(data);
    await appendAuditLog({
      user: __actor ?? "System",
      action: "Bill Generation",
      module: "Billing",
      details: `Generated draft invoice ${created.invoiceNumber} for ${created.vehicleNumber}.`,
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Failed to create invoice.");
  }
}
