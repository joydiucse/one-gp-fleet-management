export interface NavChild {
  label: string;
  href: string;
  permissionKey: string;
}

export interface NavItem {
  label: string;
  href?: string;
  iconKey: string;
  permissionKey?: string;
  children?: NavChild[];
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", iconKey: "dashboard", permissionKey: "dashboard" },
  {
    label: "Master Data",
    iconKey: "master",
    children: [
      { label: "Vehicle Master", href: "/vehicles", permissionKey: "vehicles" },
      { label: "Driver Master", href: "/drivers", permissionKey: "drivers" },
      { label: "Vehicle Category", href: "/vehicle-categories", permissionKey: "vehicle-categories" },
      { label: "Fuel Type", href: "/fuel-types", permissionKey: "fuel-types" },
    ],
  },
  { label: "Trip Requisitions", href: "/requisitions", iconKey: "trip", permissionKey: "requisitions" },
  {
    label: "Reports",
    iconKey: "reports",
    children: [
      { label: "Monthly Vehicle-wise Billing", href: "/reports/vehicle-billing", permissionKey: "reports" },
      { label: "Vendor-wise Billing", href: "/reports/vendor-billing", permissionKey: "reports" },
      { label: "Department-wise Utilization", href: "/reports/department-utilization", permissionKey: "reports" },
      { label: "Distance Travelled", href: "/reports/distance-travelled", permissionKey: "reports" },
      { label: "Overtime Cost", href: "/reports/overtime-cost", permissionKey: "reports" },
      { label: "Vehicle Category-wise Cost", href: "/reports/category-cost", permissionKey: "reports" },
      { label: "Fuel Type-wise Cost", href: "/reports/fuel-cost", permissionKey: "reports" },
      { label: "Driver Utilization", href: "/reports/driver-utilization", permissionKey: "reports" },
    ],
  },
  { label: "Audit Log", href: "/audit-log", iconKey: "audit", permissionKey: "audit-log" },
  {
    label: "Administration",
    iconKey: "admin",
    children: [
      { label: "Users", href: "/users", permissionKey: "users" },
      { label: "Roles", href: "/roles", permissionKey: "roles" },
      { label: "Integration Logs", href: "/integration", permissionKey: "integration" },
    ],
  },
];
