export type VehicleCategory =
  | "Sedan"
  | "SUV"
  | "Microbus (7 Seater)"
  | "Microbus (12 Seater)"
  | "Pickup"
  | "Minibus"
  | "Ambulance"
  | "Others";

export type FuelType = "CNG" | "LPG" | "Octane" | "Diesel" | "Hybrid";

export type VehicleStatus = "Active" | "Inactive" | "Maintenance";

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  category: VehicleCategory;
  fuelType: FuelType;
  seatCapacity: number;
  partner: string;
  monthlyFixedRent: number;
  perKmRate: number;
  otRate: number;
  status: VehicleStatus;
}

export type DriverStatus = "Active" | "Inactive" | "Suspended";

export interface Driver {
  id: string;
  name: string;
  mobile: string;
  licenseNumber: string;
  licenseAttachment: string;
  nidNumber: string;
  nidAttachment: string;
  vendor: string;
  status: DriverStatus;
}

export interface RateCard {
  id: string;
  category: VehicleCategory;
  fuelType: FuelType;
  monthlyFixedRent: number;
  perKmRate: number;
  otRatePerHour: number;
}

export type TripStatus = "Completed" | "In Progress" | "Cancelled" | "Rejected";

export interface FlagInfo {
  missingStartEndTime: boolean;
  missingDistance: boolean;
  vehicleDriverMismatch: boolean;
  duplicateTicketId: boolean;
  gpsDataMissing: boolean;
}

export interface Requisition {
  id: string;
  ticketId: string;
  requestorId: string;
  employeeName: string;
  department: string;
  requestDateTime: string;
  pickupLocation: string;
  destination: string;
  vehicleNumber: string;
  vehicleCategory: VehicleCategory;
  driverName: string;
  tripStartTime: string | null;
  tripEndTime: string | null;
  totalTravelTimeMinutes: number | null;
  totalDistanceKm: number | null;
  tripStatus: TripStatus;
  flags: FlagInfo;
  billed: boolean;
}

export type InvoiceStatus = "Draft" | "Pending Approval" | "Approved" | "Paid" | "Rejected";

export interface InvoiceCharges {
  fixedRent: number;
  personalUsageBill: number;
  distanceKm: number;
  kmRate: number;
  distanceCharge: number;
  otHours: number;
  otCharge: number;
  tollCharge: number;
  parkingCharge: number;
  startupFuelCharge: number;
  mobileBill: number;
  otherCharges: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vehicleNumber: string;
  vehicleCategory: VehicleCategory;
  partner: string;
  billingMonth: string;
  tripCount: number;
  charges: InvoiceCharges;
  totalBill: number;
  status: InvoiceStatus;
  generatedDate: string;
  approvedBy: string | null;
  approvedDate: string | null;
  adjustmentNote?: string;
}

export type UserRole =
  | "Fleet Administrator"
  | "Billing Administrator"
  | "Finance"
  | "Approver"
  | "Read Only";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "Active" | "Inactive";
  lastLogin: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}
