import { errorResponse } from "@/server/errors";
import { optionsResponse } from "@/server/reports";
import { requisitionRepository } from "@/server/repositories/requisitions";

export const runtime = "nodejs";

/** The department filter options, so the page need not download every trip. */
export async function GET() {
  try {
    return optionsResponse(await requisitionRepository.listDepartmentNames());
  } catch (error) {
    return errorResponse(error, "Failed to load departments.");
  }
}
