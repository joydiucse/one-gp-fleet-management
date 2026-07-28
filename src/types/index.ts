// Backed by the managed Vehicle Category / Fuel Type master lists
// (/api/vehicle-categories, /api/fuel-types) rather than a fixed set of
// literals, so values added there are valid without a type change here.
export type VehicleCategory = string;

export type FuelType = string;

export interface VehicleCategoryItem {
  id: string;
  name: string;
}

export interface FuelTypeItem {
  id: string;
  name: string;
}

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
  personalUsageBill: number;
  tollCharge: number;
  parkingCharge: number;
  startupFuelCharge: number;
  mobileBill: number;
  otherCharge: number;
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

export type TripStatus = "In Progress" | "Started" | "Completed" | "Cancelled" | "Rejected";

export interface FlagInfo {
  missingStartEndTime: boolean;
  missingDistance: boolean;
  vehicleDriverMismatch: boolean;
  duplicateTicketId: boolean;
  gpsDataMissing: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface TimeExtension {
  extendedAt: string;
  previousEndTime: string | null;
  newEndTime: string;
  note: string;
  extendedBy: string;
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
  pickupCoords?: GeoPoint;
  destinationCoords?: GeoPoint;
  routePolyline?: GeoPoint[];
  vehicleNumber?: string;
  vehicleCategory?: VehicleCategory;
  driverName?: string;
  vendor?: string;
  approxTripStartTime: string | null;
  approxTripEndTime: string | null;
  tripStartTime: string | null;
  tripEndTime: string | null;
  totalTravelTimeMinutes: number | null;
  totalDistanceKm: number | null;
  tripStatus: TripStatus;
  flags: FlagInfo;
  timeExtensions?: TimeExtension[];
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

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  status: "Active" | "Inactive";
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
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
