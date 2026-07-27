import { InvoiceCharges } from "@/types";

export function calculateDistanceCharge(distanceKm: number, kmRate: number): number {
  return Math.round(distanceKm * kmRate);
}

export function calculateTotalBill(charges: InvoiceCharges): number {
  return (
    charges.fixedRent +
    charges.personalUsageBill +
    charges.distanceCharge +
    charges.otCharge +
    charges.tollCharge +
    charges.parkingCharge +
    charges.startupFuelCharge +
    charges.mobileBill +
    charges.otherCharges
  );
}

export function formatBDT(amount: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}
