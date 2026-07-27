import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/store";
import { appendAuditLog } from "@/server/audit";
import { Invoice } from "@/types";
import { calculateTotalBill } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const invoices = await readCollection<Invoice>("invoices");
  const invoice = invoices.find((i) => i.id === id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<Invoice> & { __actor?: string };
  const { __actor, ...data } = body;
  const invoices = await readCollection<Invoice>("invoices");
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const merged = { ...invoices[idx], ...data, id } as Invoice;
  merged.totalBill = calculateTotalBill(merged.charges);
  invoices[idx] = merged;
  await writeCollection("invoices", invoices);
  await appendAuditLog({
    user: __actor ?? "System",
    action: "Invoice Update",
    module: "Billing",
    details: `Updated invoice ${merged.invoiceNumber}.`,
  });
  return NextResponse.json(merged);
}
