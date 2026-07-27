export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href?: string;
  iconKey: string;
  children?: NavChild[];
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", iconKey: "dashboard" },
  {
    label: "Master Data",
    iconKey: "master",
    children: [
      { label: "Vehicle Master", href: "/vehicles" },
      { label: "Driver Master", href: "/drivers" },
      { label: "Vehicle Category", href: "/vehicle-categories" },
      { label: "Fuel Type", href: "/fuel-types" },
    ],
  },
  { label: "Trip Requisitions", href: "/requisitions", iconKey: "trip" },
  { label: "Billing & Invoices", href: "/billing", iconKey: "billing" },
  { label: "Reports", href: "/reports", iconKey: "reports" },
  { label: "Audit Log", href: "/audit-log", iconKey: "audit" },
  {
    label: "Administration",
    iconKey: "admin",
    children: [
      { label: "Users & Roles", href: "/users" },
      { label: "Integration Logs", href: "/integration" },
    ],
  },
];
