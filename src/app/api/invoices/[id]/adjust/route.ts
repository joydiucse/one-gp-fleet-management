import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/store";
import { appendAuditLog } from "@/server/audit";
import { Invoice } from "@/types";
import { calculateTotalBill } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { amount: number; note: string; actor: string };

  if (!body.note?.trim() || !body.amount) {
    return NextResponse.json({ error: "Adjustment amount and note are required." }, { status: 400 });
  }

  const invoices = await readCollection<Invoice>("invoices");
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = invoices[idx];
  const charges = { ...invoice.charges, otherCharges: invoice.charges.otherCharges + body.amount };
  const noteText = `${body.note} (${body.amount >= 0 ? "+" : ""}BDT ${body.amount} by ${body.actor})`;
  const updated: Invoice = {
    ...invoice,
    charges,
    totalBill: calculateTotalBill(charges),
    adjustmentNote: noteText,
  };
  invoices[idx] = updated;
  await writeCollection("invoices", invoices);

  await appendAuditLog({
    user: body.actor,
    action: "Manual Adjustment",
    module: "Billing",
    details: `Invoice ${invoice.invoiceNumber}: ${noteText}`,
  });

  return NextResponse.json(updated);
}
