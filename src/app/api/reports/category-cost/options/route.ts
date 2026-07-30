import { errorResponse } from "@/server/errors";
import { optionsResponse } from "@/server/reports";
import { invoiceRepository } from "@/server/repositories/invoices";

export const runtime = "nodejs";

/** The vehicle category filter options, taken from the categories billed. */
export async function GET() {
  try {
    return optionsResponse(await invoiceRepository.listCategoryNames());
  } catch (error) {
    return errorResponse(error, "Failed to load vehicle categories.");
  }
}
