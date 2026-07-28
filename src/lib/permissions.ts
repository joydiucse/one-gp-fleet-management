// Single source of truth mapping app pages/menu entries to permission keys.
// Roles grant a subset of these keys; a logged-in user only sees the menu
// items and can only load the pages their role has been granted.
export interface PermissionModule {
  key: string;
  label: string;
  href: string;
  group?: string;
}

export const PERMISSION_MODULES: PermissionModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "vehicles", label: "Vehicle Master", href: "/vehicles", group: "Master Data" },
  { key: "drivers", label: "Driver Master", href: "/drivers", group: "Master Data" },
  { key: "vehicle-categories", label: "Vehicle Category", href: "/vehicle-categories", group: "Master Data" },
  { key: "fuel-types", label: "Fuel Type", href: "/fuel-types", group: "Master Data" },
  { key: "requisitions", label: "Trip Requisitions", href: "/requisitions" },
  { key: "billing", label: "Billing & Invoices", href: "/billing" },
  { key: "reports", label: "Reports", href: "/reports" },
  { key: "audit-log", label: "Audit Log", href: "/audit-log" },
  { key: "users", label: "Users", href: "/users", group: "Administration" },
  { key: "roles", label: "Roles", href: "/roles", group: "Administration" },
  { key: "integration", label: "Integration Logs", href: "/integration", group: "Administration" },
];

// Longest-href-first match so `/vehicle-categories` isn't shadowed by `/vehicles`
// (it isn't here, but this keeps the lookup correct as modules are added).
const byHrefLength = [...PERMISSION_MODULES].sort((a, b) => b.href.length - a.href.length);

export function permissionKeyForPath(pathname: string): string | null {
  for (const mod of byHrefLength) {
    if (mod.href === "/" ? pathname === "/" : pathname.startsWith(mod.href)) {
      return mod.key;
    }
  }
  return null;
}
