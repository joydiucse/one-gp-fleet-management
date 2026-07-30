/**
 * Mobile numbers are entered with punctuation ("01711-223344") but compared and
 * looked up by digits alone. Kept dependency-free so both the driver repository
 * and the sign-in path can use it without importing each other.
 */
export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, "");
}
