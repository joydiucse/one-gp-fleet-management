import { readCollection, writeCollection } from "./store";
import { AuditLog } from "@/types";

export async function appendAuditLog(entry: Omit<AuditLog, "id" | "timestamp">): Promise<AuditLog> {
  const logs = await readCollection<AuditLog>("auditLogs");
  const newLog: AuditLog = {
    id: `AL-${String(logs.length + 1).padStart(3, "0")}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  logs.unshift(newLog);
  await writeCollection("auditLogs", logs);
  return newLog;
}
