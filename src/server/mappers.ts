import { Prisma } from "@prisma/client";
import type {
  TripStatus as DbTripStatus,
  InvoiceStatus as DbInvoiceStatus,
} from "@prisma/client";
import type {
  AuditLog,
  Driver,
  FuelTypeItem,
  GeoPoint,
  Invoice,
  InvoiceCharges,
  InvoiceStatus,
  RateCard,
  Requisition,
  Role,
  TimeExtension,
  TripStatus,
  Vehicle,
  VehicleCategoryItem,
} from "@/types";
import type { IntegrationLog } from "@/data/integrationLogs";
import type { StoredUser } from "./userStore";

// Translates database rows into the exact shapes src/types/index.ts describes,
// so every API response stays identical to the JSON-backed implementation and
// no UI code has to change.
//
// Two conversions matter:
//   * DECIMAL columns arrive as Prisma.Decimal. Application code does plain
//     arithmetic on these fields, so they are converted to numbers here.
//   * Optional columns arrive as null. The domain types use `?`, and report
//     code distinguishes "absent" via `??`, so nulls become undefined.

type Decimalish = Prisma.Decimal | number | string;

/** DECIMAL/number column -> JS number. */
function num(value: Decimalish): number {
  return typeof value === "number" ? value : Number(value);
}

/** Nullable DECIMAL column -> JS number, treating absence as 0. */
function numOr0(value: Decimalish | null | undefined): number {
  return value === null || value === undefined ? 0 : num(value);
}

/** Nullable DECIMAL column -> number | undefined, preserving absence. */
function numOpt(value: Decimalish | null | undefined): number | undefined {
  return value === null || value === undefined ? undefined : num(value);
}

/** Nullable text column -> string | undefined, preserving absence. */
function strOpt(value: string | null | undefined): string | undefined {
  return value === null || value === undefined ? undefined : value;
}

/** Drops keys whose value is undefined so responses match the old JSON exactly. */
function compact<T extends object>(obj: T): T {
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] === undefined) delete obj[key];
  }
  return obj;
}

// ---------------------------------------------------------------- enums

// Prisma enum members must be valid identifiers, so the two values containing a
// space are mapped. The database itself stores the readable form.
const TRIP_STATUS_TO_DOMAIN: Record<DbTripStatus, TripStatus> = {
  IN_PROGRESS: "In Progress",
  Started: "Started",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Rejected: "Rejected",
};

const TRIP_STATUS_TO_DB: Record<TripStatus, DbTripStatus> = {
  "In Progress": "IN_PROGRESS",
  Started: "Started",
  Completed: "Completed",
  Cancelled: "Cancelled",
  Rejected: "Rejected",
};

const INVOICE_STATUS_TO_DOMAIN: Record<DbInvoiceStatus, InvoiceStatus> = {
  Draft: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  Approved: "Approved",
  Paid: "Paid",
  Rejected: "Rejected",
};

const INVOICE_STATUS_TO_DB: Record<InvoiceStatus, DbInvoiceStatus> = {
  Draft: "Draft",
  "Pending Approval": "PENDING_APPROVAL",
  Approved: "Approved",
  Paid: "Paid",
  Rejected: "Rejected",
};

export function tripStatusToDomain(value: DbTripStatus): TripStatus {
  return TRIP_STATUS_TO_DOMAIN[value];
}

export function tripStatusToDb(value: TripStatus): DbTripStatus {
  const mapped = TRIP_STATUS_TO_DB[value];
  if (!mapped) throw new Error(`Unknown trip status '${value}'.`);
  return mapped;
}

export function invoiceStatusToDomain(value: DbInvoiceStatus): InvoiceStatus {
  return INVOICE_STATUS_TO_DOMAIN[value];
}

export function invoiceStatusToDb(value: InvoiceStatus): DbInvoiceStatus {
  const mapped = INVOICE_STATUS_TO_DB[value];
  if (!mapped) throw new Error(`Unknown invoice status '${value}'.`);
  return mapped;
}

// ---------------------------------------------------------------- master data

export interface NamedRow {
  id: string;
  name: string;
}

export function toVehicleCategory(row: NamedRow): VehicleCategoryItem {
  return { id: row.id, name: row.name };
}

export function toFuelType(row: NamedRow): FuelTypeItem {
  return { id: row.id, name: row.name };
}

export interface VehicleRow {
  id: string;
  vehicleNumber: string;
  seatCapacity: number;
  partner: string;
  mobileNumber: string | null;
  monthlyFixedRent: Prisma.Decimal;
  perKmRate: Prisma.Decimal;
  otRate: Prisma.Decimal;
  rentType: "Monthly" | "Daily" | null;
  personalUsageBill: Prisma.Decimal;
  tollCharge: Prisma.Decimal;
  parkingCharge: Prisma.Decimal;
  startupFuelCharge: Prisma.Decimal;
  mobileBill: Prisma.Decimal;
  otherCharge: Prisma.Decimal;
  status: "Active" | "Inactive" | "Maintenance";
  category: { name: string };
  fuelType: { name: string };
}

export function toVehicle(row: VehicleRow): Vehicle {
  return compact({
    id: row.id,
    vehicleNumber: row.vehicleNumber,
    category: row.category.name,
    fuelType: row.fuelType.name,
    seatCapacity: row.seatCapacity,
    partner: row.partner,
    monthlyFixedRent: num(row.monthlyFixedRent),
    perKmRate: num(row.perKmRate),
    otRate: num(row.otRate),
    personalUsageBill: num(row.personalUsageBill),
    tollCharge: num(row.tollCharge),
    parkingCharge: num(row.parkingCharge),
    startupFuelCharge: num(row.startupFuelCharge),
    mobileBill: num(row.mobileBill),
    otherCharge: num(row.otherCharge),
    status: row.status,
    mobileNumber: strOpt(row.mobileNumber),
    rentType: row.rentType ?? undefined,
  });
}

export interface DriverRow {
  id: string;
  name: string;
  mobile: string;
  licenseNumber: string;
  licenseAttachment: string;
  nidNumber: string;
  nidAttachment: string;
  vendor: string;
  status: "Active" | "Inactive" | "Suspended";
}

export function toDriver(row: DriverRow): Driver {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    licenseNumber: row.licenseNumber,
    licenseAttachment: row.licenseAttachment,
    nidNumber: row.nidNumber,
    nidAttachment: row.nidAttachment,
    vendor: row.vendor,
    status: row.status,
  };
}

export interface RateCardRow {
  id: string;
  monthlyFixedRent: Prisma.Decimal;
  perKmRate: Prisma.Decimal;
  otRatePerHour: Prisma.Decimal;
  category: { name: string };
  fuelType: { name: string };
}

export function toRateCard(row: RateCardRow): RateCard {
  return {
    id: row.id,
    category: row.category.name,
    fuelType: row.fuelType.name,
    monthlyFixedRent: num(row.monthlyFixedRent),
    perKmRate: num(row.perKmRate),
    otRatePerHour: num(row.otRatePerHour),
  };
}

// ---------------------------------------------------------------- access control

export interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  status: "Active" | "Inactive";
  permissions: { permissionKey: string }[];
}

export function toRole(row: RoleRow): Role {
  return compact({
    id: row.id,
    name: row.name,
    description: strOpt(row.description),
    permissions: row.permissions.map((p) => p.permissionKey),
    status: row.status,
  });
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  status: "Active" | "Inactive";
  passwordHash: string;
  lastLogin: string | null;
  role: { name: string };
}

// The users grid renders a literal em dash for a user who has never signed in;
// the database stores that absence as NULL.
export const NEVER_LOGGED_IN = "—";

export function toStoredUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role.name,
    status: row.status,
    lastLogin: row.lastLogin ?? NEVER_LOGGED_IN,
    passwordHash: row.passwordHash,
  };
}

/** "—" and empty strings are stored as NULL rather than as literal text. */
export function lastLoginToDb(value: string | null | undefined): string | null {
  if (!value || value === NEVER_LOGGED_IN) return null;
  return value;
}

// ---------------------------------------------------------------- requisitions

export interface RequisitionRow {
  id: string;
  ticketId: string;
  requestorId: string;
  employeeName: string;
  department: string;
  requestDateTime: string;
  pickupLocation: string;
  destination: string;
  pickupLat: Prisma.Decimal | null;
  pickupLng: Prisma.Decimal | null;
  destinationLat: Prisma.Decimal | null;
  destinationLng: Prisma.Decimal | null;
  vehicleNumber: string | null;
  vehicleCategory: string | null;
  driverName: string | null;
  vendor: string | null;
  approxTripStartTime: string | null;
  approxTripEndTime: string | null;
  tripStartTime: string | null;
  tripEndTime: string | null;
  totalTravelTimeMinutes: number | null;
  totalDistanceKm: Prisma.Decimal | null;
  tripStatus: DbTripStatus;
  flagMissingStartEndTime: boolean;
  flagMissingDistance: boolean;
  flagVehicleDriverMismatch: boolean;
  flagDuplicateTicketId: boolean;
  flagGpsDataMissing: boolean;
  timeExtensions?: TimeExtensionRow[];
  routePoints?: RoutePointRow[];
}

export interface TimeExtensionRow {
  extendedAt: string;
  previousEndTime: string | null;
  newEndTime: string;
  note: string;
  extendedBy: string;
}

export interface RoutePointRow {
  lat: Prisma.Decimal;
  lng: Prisma.Decimal;
}

function toGeoPoint(
  lat: Prisma.Decimal | null,
  lng: Prisma.Decimal | null
): GeoPoint | undefined {
  if (lat === null || lng === null) return undefined;
  return { lat: num(lat), lng: num(lng) };
}

export function toTimeExtension(row: TimeExtensionRow): TimeExtension {
  return {
    extendedAt: row.extendedAt,
    previousEndTime: row.previousEndTime,
    newEndTime: row.newEndTime,
    note: row.note,
    extendedBy: row.extendedBy,
  };
}

export function toRoutePoints(rows: RoutePointRow[] | undefined): GeoPoint[] | undefined {
  if (!rows || rows.length === 0) return undefined;
  return rows.map((p) => ({ lat: num(p.lat), lng: num(p.lng) }));
}

export function toRequisition(row: RequisitionRow): Requisition {
  return compact({
    id: row.id,
    ticketId: row.ticketId,
    requestorId: row.requestorId,
    employeeName: row.employeeName,
    department: row.department,
    requestDateTime: row.requestDateTime,
    pickupLocation: row.pickupLocation,
    destination: row.destination,
    pickupCoords: toGeoPoint(row.pickupLat, row.pickupLng),
    destinationCoords: toGeoPoint(row.destinationLat, row.destinationLng),
    routePolyline: toRoutePoints(row.routePoints),
    vehicleNumber: strOpt(row.vehicleNumber),
    vehicleCategory: strOpt(row.vehicleCategory),
    driverName: strOpt(row.driverName),
    vendor: strOpt(row.vendor),
    approxTripStartTime: row.approxTripStartTime,
    approxTripEndTime: row.approxTripEndTime,
    tripStartTime: row.tripStartTime,
    tripEndTime: row.tripEndTime,
    totalTravelTimeMinutes: row.totalTravelTimeMinutes,
    totalDistanceKm: numOpt(row.totalDistanceKm) ?? null,
    tripStatus: tripStatusToDomain(row.tripStatus),
    flags: {
      missingStartEndTime: row.flagMissingStartEndTime,
      missingDistance: row.flagMissingDistance,
      vehicleDriverMismatch: row.flagVehicleDriverMismatch,
      duplicateTicketId: row.flagDuplicateTicketId,
      gpsDataMissing: row.flagGpsDataMissing,
    },
    timeExtensions:
      row.timeExtensions && row.timeExtensions.length > 0
        ? row.timeExtensions.map(toTimeExtension)
        : undefined,
  });
}

// ---------------------------------------------------------------- invoices

export interface InvoiceChargeRow {
  fixedRent: Prisma.Decimal;
  personalUsageBill: Prisma.Decimal;
  distanceKm: Prisma.Decimal;
  kmRate: Prisma.Decimal;
  distanceCharge: Prisma.Decimal;
  otHours: Prisma.Decimal;
  otCharge: Prisma.Decimal;
  tollCharge: Prisma.Decimal;
  parkingCharge: Prisma.Decimal;
  startupFuelCharge: Prisma.Decimal;
  mobileBill: Prisma.Decimal;
  otherCharges: Prisma.Decimal;
  usageFrom: string | null;
  usageTo: string | null;
  kmOctane: Prisma.Decimal | null;
  kmLPG: Prisma.Decimal | null;
  kmCNG: Prisma.Decimal | null;
  kmHybrid: Prisma.Decimal | null;
  rateOctane: Prisma.Decimal | null;
  rateLPG: Prisma.Decimal | null;
  rateCNG: Prisma.Decimal | null;
  rateHybrid: Prisma.Decimal | null;
  driverDaDays: Prisma.Decimal | null;
  driverDaAmount: Prisma.Decimal | null;
  extraServiceRate: Prisma.Decimal | null;
  extraServiceHour: Prisma.Decimal | null;
  extraServiceAmount: Prisma.Decimal | null;
  adjustmentAbsent: Prisma.Decimal | null;
  iftarBillRate: Prisma.Decimal | null;
  iftarBillDays: Prisma.Decimal | null;
  iftarBillAmount: Prisma.Decimal | null;
}

export function toInvoiceCharges(row: InvoiceChargeRow | null): InvoiceCharges {
  if (!row) {
    // An invoice with no charge row would be a data fault, but the reports and
    // the total calculation both expect a fully populated object.
    return {
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
    };
  }
  return compact({
    fixedRent: num(row.fixedRent),
    personalUsageBill: num(row.personalUsageBill),
    distanceKm: num(row.distanceKm),
    kmRate: num(row.kmRate),
    distanceCharge: num(row.distanceCharge),
    otHours: num(row.otHours),
    otCharge: num(row.otCharge),
    tollCharge: num(row.tollCharge),
    parkingCharge: num(row.parkingCharge),
    startupFuelCharge: num(row.startupFuelCharge),
    mobileBill: num(row.mobileBill),
    otherCharges: num(row.otherCharges),
    usageFrom: strOpt(row.usageFrom),
    usageTo: strOpt(row.usageTo),
    kmOctane: numOpt(row.kmOctane),
    kmLPG: numOpt(row.kmLPG),
    kmCNG: numOpt(row.kmCNG),
    kmHybrid: numOpt(row.kmHybrid),
    rateOctane: numOpt(row.rateOctane),
    rateLPG: numOpt(row.rateLPG),
    rateCNG: numOpt(row.rateCNG),
    rateHybrid: numOpt(row.rateHybrid),
    driverDaDays: numOpt(row.driverDaDays),
    driverDaAmount: numOpt(row.driverDaAmount),
    extraServiceRate: numOpt(row.extraServiceRate),
    extraServiceHour: numOpt(row.extraServiceHour),
    extraServiceAmount: numOpt(row.extraServiceAmount),
    adjustmentAbsent: numOpt(row.adjustmentAbsent),
    iftarBillRate: numOpt(row.iftarBillRate),
    iftarBillDays: numOpt(row.iftarBillDays),
    iftarBillAmount: numOpt(row.iftarBillAmount),
  });
}

/** Domain charges -> column values, mapping absent optionals back to NULL. */
export function chargesToDb(charges: InvoiceCharges) {
  const optional = (value: number | undefined) => (value === undefined ? null : value);
  return {
    fixedRent: numOr0(charges.fixedRent),
    personalUsageBill: numOr0(charges.personalUsageBill),
    distanceKm: numOr0(charges.distanceKm),
    kmRate: numOr0(charges.kmRate),
    distanceCharge: numOr0(charges.distanceCharge),
    otHours: numOr0(charges.otHours),
    otCharge: numOr0(charges.otCharge),
    tollCharge: numOr0(charges.tollCharge),
    parkingCharge: numOr0(charges.parkingCharge),
    startupFuelCharge: numOr0(charges.startupFuelCharge),
    mobileBill: numOr0(charges.mobileBill),
    otherCharges: numOr0(charges.otherCharges),
    usageFrom: charges.usageFrom ?? null,
    usageTo: charges.usageTo ?? null,
    kmOctane: optional(charges.kmOctane),
    kmLPG: optional(charges.kmLPG),
    kmCNG: optional(charges.kmCNG),
    kmHybrid: optional(charges.kmHybrid),
    rateOctane: optional(charges.rateOctane),
    rateLPG: optional(charges.rateLPG),
    rateCNG: optional(charges.rateCNG),
    rateHybrid: optional(charges.rateHybrid),
    driverDaDays: optional(charges.driverDaDays),
    driverDaAmount: optional(charges.driverDaAmount),
    extraServiceRate: optional(charges.extraServiceRate),
    extraServiceHour: optional(charges.extraServiceHour),
    extraServiceAmount: optional(charges.extraServiceAmount),
    adjustmentAbsent: optional(charges.adjustmentAbsent),
    iftarBillRate: optional(charges.iftarBillRate),
    iftarBillDays: optional(charges.iftarBillDays),
    iftarBillAmount: optional(charges.iftarBillAmount),
  };
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  vehicleNumber: string;
  vehicleCategory: string;
  partner: string;
  billingMonth: string;
  tripCount: number;
  totalBill: Prisma.Decimal;
  status: DbInvoiceStatus;
  generatedDate: string;
  approvedBy: string | null;
  approvedDate: string | null;
  adjustmentNote: string | null;
  charges: InvoiceChargeRow | null;
}

export function toInvoice(row: InvoiceRow): Invoice {
  return compact({
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    vehicleNumber: row.vehicleNumber,
    vehicleCategory: row.vehicleCategory,
    partner: row.partner,
    billingMonth: row.billingMonth,
    tripCount: row.tripCount,
    charges: toInvoiceCharges(row.charges),
    totalBill: num(row.totalBill),
    status: invoiceStatusToDomain(row.status),
    generatedDate: row.generatedDate,
    approvedBy: row.approvedBy,
    approvedDate: row.approvedDate,
    adjustmentNote: strOpt(row.adjustmentNote),
  });
}

// ---------------------------------------------------------------- logs

export interface AuditLogRow {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

export function toAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    timestamp: row.timestamp,
    user: row.user,
    action: row.action,
    module: row.module,
    details: row.details,
  };
}

export interface IntegrationLogRow {
  id: string;
  timestamp: string;
  direction: "Inbound" | "Outbound";
  payloadType: string;
  referenceId: string;
  status: "Success" | "Failed" | "Retried";
  message: string;
}

export function toIntegrationLog(row: IntegrationLogRow): IntegrationLog {
  return {
    id: row.id,
    timestamp: row.timestamp,
    direction: row.direction,
    payloadType: row.payloadType,
    referenceId: row.referenceId,
    status: row.status,
    message: row.message,
  };
}
