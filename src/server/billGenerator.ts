import { calculateDistanceCharge } from "@/lib/billing";
import { Requisition } from "@/types";
import { prisma } from "./db";
import { appendAuditLog } from "./audit";
import { invoiceRepository } from "./repositories/invoices";
import { toVehicle } from "./mappers";

function billingMonthOf(dateIso: string): string {
  return dateIso.slice(0, 7);
}

// Invoices are aggregated per vehicle per billing month. Completing a trip
// rolls its distance into that month's Draft invoice, creating it if needed.
export async function generateBillForCompletedTrip(
  requisition: Requisition,
  actor: string
): Promise<void> {
  if (!requisition.vehicleNumber) return;

  const vehicleRow = await prisma.vehicle.findUnique({
    where: { vehicleNumber: requisition.vehicleNumber },
    include: { category: { select: { name: true } }, fuelType: { select: { name: true } } },
  });
  if (!vehicleRow) return;
  const vehicle = toVehicle(vehicleRow);

  const billingMonth = billingMonthOf(requisition.requestDateTime);
  const distanceKm = requisition.totalDistanceKm ?? 0;

  const existing = await invoiceRepository.findDraftFor(vehicle.vehicleNumber, billingMonth);

  if (existing) {
    const updated = await invoiceRepository.addTripToDraft(
      existing.id,
      distanceKm,
      vehicle.perKmRate
    );
    if (updated) {
      await appendAuditLog({
        user: actor,
        action: "Bill Generation",
        module: "Billing",
        details: `Updated draft invoice ${updated.invoiceNumber} for ${updated.vehicleNumber} (trip ${requisition.ticketId}).`,
      });
    }
    return;
  }

  const created = await invoiceRepository.createDraft({
    vehicleNumber: vehicle.vehicleNumber,
    vehicleCategory: vehicle.category,
    partner: vehicle.partner,
    billingMonth,
    charges: {
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
    },
  });

  await appendAuditLog({
    user: actor,
    action: "Bill Generation",
    module: "Billing",
    details: `Generated draft invoice ${created.invoiceNumber} for ${created.vehicleNumber} (trip ${requisition.ticketId}).`,
  });
}
