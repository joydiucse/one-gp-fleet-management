import { readCollection } from "./store";
import { Role } from "@/types";

export async function readRoles(): Promise<Role[]> {
  return readCollection<Role>("roles");
}

export async function permissionsForRole(roleName: string): Promise<string[]> {
  const roles = await readRoles();
  return roles.find((r) => r.name === roleName)?.permissions ?? [];
}
