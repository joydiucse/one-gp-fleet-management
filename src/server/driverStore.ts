import { readCollection } from "./store";
import { Driver } from "@/types";

export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, "");
}

export async function readDrivers(): Promise<Driver[]> {
  return readCollection<Driver>("drivers");
}
