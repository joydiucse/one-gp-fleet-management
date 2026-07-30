import { errorResponse } from "@/server/errors";
import { optionsResponse } from "@/server/reports";
import { requisitionRepository } from "@/server/repositories/requisitions";

export const runtime = "nodejs";

/**
 * The vendor filter options for the vendor billing report. Vendor is captured
 * per trip requisition, so the options are the distinct vendors on trips.
 */
export async function GET() {
  try {
    return optionsResponse(await requisitionRepository.listVendorNames());
  } catch (error) {
    return errorResponse(error, "Failed to load vendors.");
  }
}
