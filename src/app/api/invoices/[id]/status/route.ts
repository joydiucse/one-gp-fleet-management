import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/store";
import { appendAuditLog } from "@/server/audit";
import { Invoice, InvoiceStatus } from "@/types";

export const runtime = "nodejs";

const AUDIT_ACTION: Record<InvoiceStatus, string> = {
  Draft: "Bill Generation",
  "Pending Approval": "Bill Submission",
  Approved: "Bill Approval",
  Paid: "Payment Recorded",
  Rejected: "Bill Rejection",
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { status: InvoiceStatus; actor: string; note?: string };
  const invoices = await readCollection<Invoice>("invoices");
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = invoices[idx];
  const now = new Date().toISOString();
  const isTerminalAction = ["Approved", "Paid", "Rejected"].includes(body.status);

  const updated: Invoice = {
    ...invoice,
    status: body.status,
    approvedBy: isTerminalAction ? body.actor : invoice.approvedBy,
    approvedDate: isTerminalAction ? now : invoice.approvedDate,
    adjustmentNote: body.note ?? invoice.adjustmentNote,
  };
  invoices[idx] = updated;
  await writeCollection("invoices", invoices);

  await appendAuditLog({
    user: body.actor,
    action: AUDIT_ACTION[body.status] ?? "Bill Status Change",
    module: "Billing",
    details: `Invoice ${invoice.invoiceNumber} status changed to '${body.status}'.${body.note ? ` Note: ${body.note}` : ""}`,
  });

  return NextResponse.json(updated);
}
