import type ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { DomainError } from "./errors";

/** Shared bits of the report API routes: filter parsing and xlsx responses. */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** `2026-07` -> `July 2026`. Throws on anything that is not a billing month. */
export function monthLabelOf(billingMonth: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(billingMonth);
  if (!match) throw new DomainError("A billing month in YYYY-MM format is required.");
  return `${MONTH_NAMES[Number(match[2]) - 1]} ${match[1]}`;
}

export interface ReportDateRange {
  from: string;
  to: string;
  /**
   * The billing month of `from`, YYYY-MM. Only meaningful for the reports that
   * pass `singleMonth`, which is what keeps the range inside one month.
   */
  billingMonth: string;
  /** `1 - 31 July 2026`, for report titles and file names. */
  rangeLabel: string;
  /** The day after `to`, an exclusive upper bound for date-string queries. */
  toExclusive: string;
}

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function dayOf(date: string): number {
  return Number(date.slice(8, 10));
}

/** `1 - 31 July 2026`, collapsing the parts the two dates share. */
function rangeLabelOf(from: string, to: string): string {
  const [fromYear, fromMonth] = [Number(from.slice(0, 4)), Number(from.slice(5, 7))];
  const [toYear, toMonth] = [Number(to.slice(0, 4)), Number(to.slice(5, 7))];
  const fromName = MONTH_NAMES[fromMonth - 1];
  const toName = MONTH_NAMES[toMonth - 1];

  if (fromYear === toYear && fromMonth === toMonth) {
    return `${dayOf(from)} - ${dayOf(to)} ${fromName} ${fromYear}`;
  }
  if (fromYear === toYear) {
    return `${dayOf(from)} ${fromName} - ${dayOf(to)} ${toName} ${fromYear}`;
  }
  return `${dayOf(from)} ${fromName} ${fromYear} - ${dayOf(to)} ${toName} ${toYear}`;
}

/**
 * Parses a from/to date filter.
 *
 * `singleMonth` is for the reports whose figures come from whole-month invoices:
 * a range spanning two months would make the billing month ambiguous, so those
 * reject it. Reports computed from the trips themselves take any range.
 */
export function parseDateRange(
  from: string | null,
  to: string | null,
  options: { singleMonth?: boolean } = {}
): ReportDateRange {
  if (!from || !DATE_PATTERN.test(from) || !to || !DATE_PATTERN.test(to)) {
    throw new DomainError("A from and to date in YYYY-MM-DD format are required.");
  }
  if (from > to) {
    throw new DomainError("The from date must not be after the to date.");
  }
  const billingMonth = from.slice(0, 7);
  if (options.singleMonth && to.slice(0, 7) !== billingMonth) {
    throw new DomainError("The date range must stay within a single calendar month.");
  }

  // `to` covers its whole day. Trip timestamps are `YYYY-MM-DDTHH:MM` strings,
  // which sort before the next day's date, so the day after `to` is a correct
  // exclusive bound for a string comparison.
  const toExclusive = new Date(Date.UTC(Number(to.slice(0, 4)), Number(to.slice(5, 7)) - 1, dayOf(to) + 1))
    .toISOString()
    .slice(0, 10);

  return { from, to, billingMonth, rangeLabel: rangeLabelOf(from, to), toExclusive };
}

/** Splits a comma-separated filter param; an empty param means "no filter". */
export function parseIdList(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Rejects an `export_type` the route does not implement, so a typo fails loudly
 * instead of silently returning JSON.
 */
export function assertExportType(value: string | null, supported: string[]): void {
  if (value !== null && !supported.includes(value)) {
    throw new DomainError(`Unsupported export_type "${value}".`);
  }
}

/** The `{ id, label }[]` shape the report pages' filter dropdowns expect. */
export function optionsResponse(names: string[]): NextResponse {
  return NextResponse.json(names.map((name) => ({ id: name, label: name })));
}

/** Streams a workbook as a file download. */
export async function xlsxResponse(
  workbook: ExcelJS.Workbook,
  fileName: string
): Promise<NextResponse> {
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
