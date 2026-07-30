import { AuditLog } from "@/types";
import { prisma } from "./db";
import { allocateId } from "./ids";
import { toAuditLog } from "./mappers";

// Column limits, so an over-long detail line is truncated rather than failing
// the write and taking the action that produced it down with it.
const MAX_DETAILS = 1000;
const MAX_SHORT = 120;

function clamp(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export async function appendAuditLog(
  entry: Omit<AuditLog, "id" | "timestamp">
): Promise<AuditLog> {
  const row = await prisma.$transaction(async (tx) => {
    const { id, seq } = await allocateId(tx, "auditLogs");
    return tx.auditLog.create({
      data: {
        id,
        seq,
        timestamp: new Date().toISOString(),
        user: clamp(entry.user, 160),
        action: clamp(entry.action, MAX_SHORT),
        module: clamp(entry.module, MAX_SHORT),
        details: clamp(entry.details, MAX_DETAILS),
      },
    });
  });
  return toAuditLog(row);
}

/**
 * Newest first, which is the order the audit log page renders.
 *
 * Ordered by timestamp rather than by id: the earliest seeded entries were
 * numbered in ascending order for descending timestamps, so id order and
 * chronological order disagree there. `seq` only breaks ties between entries
 * written in the same millisecond.
 *
 * The stored timestamps are ISO-8601, where lexicographic and chronological
 * order coincide (a fractional-seconds suffix sorts after the same whole
 * second, which is also chronologically correct).
 */
export async function readAuditLogs(): Promise<AuditLog[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: [{ timestamp: "desc" }, { seq: "desc" }],
  });
  return rows.map(toAuditLog);
}
