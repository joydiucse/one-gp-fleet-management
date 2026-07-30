import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog } from "@/server/audit";
import { errorResponse } from "@/server/errors";
import { invoiceRepository } from "@/server/repositories/invoices";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const invoice = await invoiceRepository.find(id);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    return errorResponse(error, "Failed to load invoice.");
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as Record<string, unknown> & { __actor?: string };
    const { __actor, ...data } = body;
    // The repository recalculates the total from the charge breakdown.
    const updated = await invoiceRepository.update(id, data);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await appendAuditLog({
      user: __actor ?? "System",
      action: "Invoice Update",
      module: "Billing",
      details: `Updated invoice ${updated.invoiceNumber}.`,
    });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, "Failed to update invoice.");
  }
}
