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
  { label: "Billing & Invoices", href: "/billing", iconKey: "billing", permissionKey: "billing" },
  { label: "Reports", href: "/reports", iconKey: "reports", permissionKey: "reports" },
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
