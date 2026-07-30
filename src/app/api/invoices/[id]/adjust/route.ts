import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog } from "@/server/audit";
import { errorResponse } from "@/server/errors";
import { invoiceRepository } from "@/server/repositories/invoices";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { amount: number; note: string; actor: string };

    if (!body.note?.trim() || !body.amount) {
      return NextResponse.json(
        { error: "Adjustment amount and note are required." },
        { status: 400 }
      );
    }

    // Recorded on the invoice so the reason travels with the amount.
    const noteText = `${body.note} (${body.amount >= 0 ? "+" : ""}BDT ${body.amount} by ${body.actor})`;
    const result = await invoiceRepository.applyAdjustment(id, body.amount, noteText);
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await appendAuditLog({
      user: body.actor,
      action: "Manual Adjustment",
      module: "Billing",
      details: `Invoice ${result.invoice.invoiceNumber}: ${noteText}`,
    });

    return NextResponse.json(result.invoice);
  } catch (error) {
    return errorResponse(error, "Failed to apply adjustment.");
  }
}
