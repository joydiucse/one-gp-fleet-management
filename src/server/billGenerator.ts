import { readCollection, writeCollection } from "./store";
import { appendAuditLog } from "./audit";
import { calculateDistanceCharge, calculateTotalBill } from "@/lib/billing";
import { Requisition, Vehicle, Invoice } from "@/types";

function billingMonthOf(dateIso: string): string {
  return dateIso.slice(0, 7);
}

// Invoices are aggregated per vehicle per billing month. Completing a trip
// rolls its distance into that month's Draft invoice, creating it if needed.
export async function generateBillForCompletedTrip(requisition: Requisition, actor: string): Promise<void> {
  const vehicles = await readCollection<Vehicle>("vehicles");
  const vehicle = vehicles.find((v) => v.vehicleNumber === requisition.vehicleNumber);
  if (!vehicle) return;

  const billingMonth = billingMonthOf(requisition.requestDateTime);
  const distanceKm = requisition.totalDistanceKm ?? 0;
  const invoices = await readCollection<Invoice>("invoices");
  const existingIdx = invoices.findIndex(
    (inv) => inv.vehicleNumber === requisition.vehicleNumber && inv.billingMonth === billingMonth && inv.status === "Draft"
  );

  if (existingIdx !== -1) {
    const existing = invoices[existingIdx];
    const charges = {
      ...existing.charges,
      distanceKm: existing.charges.distanceKm + distanceKm,
      kmRate: vehicle.perKmRate,
    };
    charges.distanceCharge = calculateDistanceCharge(charges.distanceKm, charges.kmRate);
    const updated: Invoice = {
      ...existing,
      tripCount: existing.tripCount + 1,
      charges,
      totalBill: calculateTotalBill(charges),
    };
    invoices[existingIdx] = updated;
    await writeCollection("invoices", invoices);
    await appendAuditLog({
      user: actor,
      action: "Bill Generation",
      module: "Billing",
      details: `Updated draft invoice ${updated.invoiceNumber} for ${updated.vehicleNumber} (trip ${requisition.ticketId}).`,
    });
    return;
  }

  let maxSeq = 0;
  for (const inv of invoices) {
    const match = /(\d+)$/.exec(inv.id);
    if (match) maxSeq = Math.max(maxSeq, Number(match[1]));
  }
  const id = `INV-${billingMonth}-${String(maxSeq + 1).padStart(3, "0")}`;
  const charges = {
    fixedRent: vehicle.monthlyFixedRent,
    personalUsageBill: 0,
    distanceKm,
    kmRate: vehicle.perKmRate,
    distanceCharge: calculateDistanceCharge(distanceKm, vehicle.perKmRate),
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
    invoiceNumber: id,
    vehicleNumber: vehicle.vehicleNumber,
    vehicleCategory: vehicle.category,
    partner: vehicle.partner,
    billingMonth,
    tripCount: 1,
    charges,
    totalBill: calculateTotalBill(charges),
    status: "Draft",
    generatedDate: new Date().toISOString(),
    approvedBy: null,
    approvedDate: null,
  };
  invoices.push(created);
  await writeCollection("invoices", invoices);
  await appendAuditLog({
    user: actor,
    action: "Bill Generation",
    module: "Billing",
    details: `Generated draft invoice ${created.invoiceNumber} for ${created.vehicleNumber} (trip ${requisition.ticketId}).`,
  });
}
