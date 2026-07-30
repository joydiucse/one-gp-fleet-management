/**
 * The contract every collection repository implements. It is deliberately the
 * small set of operations the generic CRUD route factory needs, so adding a
 * master-data list stays a matter of one repository plus two route files.
 *
 * `data` is the request body with the `__actor` field already stripped: a
 * partial domain object as defined in src/types/index.ts. Each repository is
 * responsible for translating that into its own columns.
 */
export interface Repository<T> {
  list(): Promise<T[]>;
  find(id: string): Promise<T | null>;
  create(data: Record<string, unknown>): Promise<T>;
  /** Resolves to null when no record has that id. */
  update(id: string, data: Record<string, unknown>): Promise<T | null>;
  /** Resolves to the removed record, or null when no record has that id. */
  remove(id: string): Promise<T | null>;
}

// ------------------------------------------------------------------ coercion

/**
 * Request bodies arrive as JSON, so a numeric field can turn up as a string.
 * These helpers apply the field's type without silently inventing values: an
 * absent key falls back to the supplied default.
 */
export function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function asOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value : String(value);
  return text.trim() === "" ? null : text;
}

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function asOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = asNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

export function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

/**
 * Picks a value from the body only when the key is present, so a partial update
 * leaves untouched columns alone instead of resetting them to a default.
 */
export function whenPresent<V>(
  data: Record<string, unknown>,
  key: string,
  convert: (value: unknown) => V
): { [k: string]: V } | Record<string, never> {
  return key in data ? { [key]: convert(data[key]) } : {};
}
