import { errorResponse } from "@/server/errors";
import { optionsResponse } from "@/server/reports";
import { requisitionRepository } from "@/server/repositories/requisitions";

export const runtime = "nodejs";

/** The driver filter options, including "Unassigned" when trips lack a driver. */
export async function GET() {
  try {
    return optionsResponse(await requisitionRepository.listDriverNames());
  } catch (error) {
    return errorResponse(error, "Failed to load drivers.");
  }
}
