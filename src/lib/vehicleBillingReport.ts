import { Invoice, Vehicle } from "@/types";

// Fixed fuel consumption rates shown in the report header ("@ BDT 130/60/43/130").
export const FUEL_CONS_RATE: Record<string, number> = {
  Octane: 130,
  LPG: 60,
  CNG: 43,
  Hybrid: 130,
};

export function getFuelConsRate(fuelType: string): number {
  return FUEL_CONS_RATE[fuelType] ?? 0;
}

export interface VehicleBillingRow {
  vehicleId: string;
  vehicleNumber: string;
  mobileNumber: string;
  vehicleType: string;
  rentType: string;
  usageFrom: string;
  usageTo: string;
  fuelConsRate: number;
  totalKmRun: number;
  kmOctane: number;
  kmLPG: number;
  kmCNG: number;
  kmHybrid: number;
  rateOctane: number;
  rateLPG: number;
  rateCNG: number;
  rateHybrid: number;
  costOctane: number;
  costLPG: number;
  costCNG: number;
  costHybrid: number;
  totalKmCost: number;
  startupFuelCost: number;
  driverDaDays: number;
  driverDaAmount: number;
  tollCharge: number;
  parkingCharge: number;
  rentAmount: number;
  extraServiceRate: number;
  extraServiceHour: number;
  extraServiceAmount: number;
  mobileBill: number;
  adjustmentAbsent: number;
  iftarBillRate: number;
  iftarBillDays: number;
  iftarBillAmount: number;
  totalAmount: number;
  vatAmount: number;
  grandTotal: number;
  remarks: string;
}

function bucketByFuelType(fuelType: string, target: string, value: number): number {
  return fuelType === target ? value : 0;
}

export function buildVehicleBillingRows(
  invoices: Invoice[],
  vehicles: Vehicle[],
  vehicleIds: string[],
  billingMonth: string
): VehicleBillingRow[] {
  const selected = vehicles.filter((v) => vehicleIds.includes(v.id));

  return selected.map((vehicle) => {
    const invoice = invoices.find(
      (i) => i.vehicleNumber === vehicle.vehicleNumber && i.billingMonth === billingMonth
    );
    const charges = invoice?.charges;
    const fuelType = vehicle.fuelType;
    const distanceKm = charges?.distanceKm ?? 0;
    const kmRate = charges?.kmRate ?? vehicle.perKmRate ?? 0;

    const kmOctane = charges?.kmOctane ?? bucketByFuelType(fuelType, "Octane", distanceKm);
    const kmLPG = charges?.kmLPG ?? bucketByFuelType(fuelType, "LPG", distanceKm);
    const kmCNG = charges?.kmCNG ?? bucketByFuelType(fuelType, "CNG", distanceKm);
    const kmHybrid = charges?.kmHybrid ?? bucketByFuelType(fuelType, "Hybrid", distanceKm);

    const rateOctane = charges?.rateOctane ?? bucketByFuelType(fuelType, "Octane", kmRate);
    const rateLPG = charges?.rateLPG ?? bucketByFuelType(fuelType, "LPG", kmRate);
    const rateCNG = charges?.rateCNG ?? bucketByFuelType(fuelType, "CNG", kmRate);
    const rateHybrid = charges?.rateHybrid ?? bucketByFuelType(fuelType, "Hybrid", kmRate);

    const costOctane = Math.round(kmOctane * rateOctane);
    const costLPG = Math.round(kmLPG * rateLPG);
    const costCNG = Math.round(kmCNG * rateCNG);
    const costHybrid = Math.round(kmHybrid * rateHybrid);
    const totalKmCost = costOctane + costLPG + costCNG + costHybrid;

    const startupFuelCost = charges?.startupFuelCharge ?? vehicle.startupFuelCharge ?? 0;
    const driverDaDays = charges?.driverDaDays ?? 0;
    const driverDaAmount = charges?.driverDaAmount ?? 0;
    const tollCharge = charges?.tollCharge ?? vehicle.tollCharge ?? 0;
    const parkingCharge = charges?.parkingCharge ?? vehicle.parkingCharge ?? 0;
    const rentAmount = charges?.fixedRent ?? vehicle.monthlyFixedRent ?? 0;
    const extraServiceRate = charges?.extraServiceRate ?? 0;
    const extraServiceHour = charges?.extraServiceHour ?? 0;
    const extraServiceAmount = charges?.extraServiceAmount ?? Math.round(extraServiceRate * extraServiceHour);
    const mobileBill = charges?.mobileBill ?? vehicle.mobileBill ?? 0;
    const adjustmentAbsent = charges?.adjustmentAbsent ?? 0;
    const iftarBillRate = charges?.iftarBillRate ?? 0;
    const iftarBillDays = charges?.iftarBillDays ?? 0;
    const iftarBillAmount = charges?.iftarBillAmount ?? Math.round(iftarBillRate * iftarBillDays);

    const totalAmount =
      rentAmount +
      totalKmCost +
      startupFuelCost +
      driverDaAmount +
      tollCharge +
      parkingCharge +
      extraServiceAmount +
      mobileBill +
      adjustmentAbsent +
      iftarBillAmount;
    const vatAmount = Math.round(totalAmount * 0.15);
    const grandTotal = totalAmount + vatAmount;

    return {
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      mobileNumber: vehicle.mobileNumber ?? "",
      vehicleType: vehicle.category,
      rentType: vehicle.rentType ?? "Monthly",
      usageFrom: charges?.usageFrom ?? "",
      usageTo: charges?.usageTo ?? "",
      fuelConsRate: getFuelConsRate(fuelType),
      totalKmRun: distanceKm,
      kmOctane,
      kmLPG,
      kmCNG,
      kmHybrid,
      rateOctane,
      rateLPG,
      rateCNG,
      rateHybrid,
      costOctane,
      costLPG,
      costCNG,
      costHybrid,
      totalKmCost,
      startupFuelCost,
      driverDaDays,
      driverDaAmount,
      tollCharge,
      parkingCharge,
      rentAmount,
      extraServiceRate,
      extraServiceHour,
      extraServiceAmount,
      mobileBill,
      adjustmentAbsent,
      iftarBillRate,
      iftarBillDays,
      iftarBillAmount,
      totalAmount,
      vatAmount,
      grandTotal,
      remarks: invoice?.adjustmentNote ?? "",
    };
  });
}
