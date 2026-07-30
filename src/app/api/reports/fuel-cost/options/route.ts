import { errorResponse } from "@/server/errors";
import { optionsResponse } from "@/server/reports";
import { vehicleRepository } from "@/server/repositories/vehicles";

export const runtime = "nodejs";

/** The fuel type filter options, taken from the fuel types in use in the fleet. */
export async function GET() {
  try {
    return optionsResponse(await vehicleRepository.listFuelTypeNames());
  } catch (error) {
    return errorResponse(error, "Failed to load fuel types.");
  }
}
