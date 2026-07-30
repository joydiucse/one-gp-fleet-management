import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/server/store";
import { appendAuditLog } from "@/server/audit";
import { Invoice } from "@/types";
import { calculateTotalBill } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET() {
  const invoices = await readCollection<Invoice>("invoices");
  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<Invoice> & { __actor?: string };
  const { __actor, ...data } = body;
  const invoices = await readCollection<Invoice>("invoices");

  let maxSeq = 0;
  for (const inv of invoices) {
    const match = /(\d+)$/.exec(inv.id);
    if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
  }
  const id = `INV-${data.billingMonth ?? "0000-00"}-${String(maxSeq + 1).padStart(3, "0")}`;
  const charges = data.charges ?? {
    fixedRent: 0,
    personalUsageBill: 0,
    distanceKm: 0,
    kmRate: 0,
    distanceCharge: 0,
    otHours: 0,
    otCharge: 0,
    tollCharge: 0,
    parkingCharge: 0,
    startupFuelCharge: 0,
    mobileBill: 0,
    otherCharges: 0,
    driverDaDays: 0,
    driverDaAmount: 0,
    extraServiceRate: 0,
    extraServiceHour: 0,
    extraServiceAmount: 0,
    adjustmentAbsent: 0,
    iftarBillRate: 0,
    iftarBillDays: 0,
    iftarBillAmount: 0,
  };

  const created: Invoice = {
    id,
    invoiceNumber: data.invoiceNumber ?? id,
    vehicleNumber: data.vehicleNumber ?? "",
    vehicleCategory: data.vehicleCategory ?? "Sedan",
    partner: data.partner ?? "",
    billingMonth: data.billingMonth ?? "",
    tripCount: data.tripCount ?? 0,
    charges,
    totalBill: calculateTotalBill(charges),
    status: data.status ?? "Draft",
    generatedDate: new Date().toISOString(),
    approvedBy: null,
    approvedDate: null,
  };

  invoices.push(created);
  await writeCollection("invoices", invoices);
  await appendAuditLog({
    user: __actor ?? "System",
    action: "Bill Generation",
    module: "Billing",
    details: `Generated draft invoice ${created.invoiceNumber} for ${created.vehicleNumber}.`,
  });
  return NextResponse.json(created, { status: 201 });
}
