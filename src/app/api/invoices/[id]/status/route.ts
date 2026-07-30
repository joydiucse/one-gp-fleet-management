import { NextRequest, NextResponse } from "next/server";
import { appendAuditLog } from "@/server/audit";
import { errorResponse } from "@/server/errors";
import { invoiceRepository } from "@/server/repositories/invoices";
import { InvoiceStatus } from "@/types";

export const runtime = "nodejs";

const AUDIT_ACTION: Record<InvoiceStatus, string> = {
  Draft: "Bill Generation",
  "Pending Approval": "Bill Submission",
  Approved: "Bill Approval",
  Paid: "Payment Recorded",
  Rejected: "Bill Rejection",
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { status: InvoiceStatus; actor: string; note?: string };

    const updated = await invoiceRepository.setStatus(id, body.status, body.actor, body.note);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await appendAuditLog({
      user: body.actor,
      action: AUDIT_ACTION[body.status] ?? "Bill Status Change",
      module: "Billing",
      details: `Invoice ${updated.invoiceNumber} status changed to '${body.status}'.${
        body.note ? ` Note: ${body.note}` : ""
      }`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error, "Failed to update invoice status.");
  }
}
