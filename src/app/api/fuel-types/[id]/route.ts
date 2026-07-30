import { itemRoutes } from "@/server/crudFactory";
import { FuelTypeItem } from "@/types";

export const runtime = "nodejs";

const routes = itemRoutes<FuelTypeItem>({
  collection: "fuelTypes",
  auditModule: "Fuel Type",
  labelField: "name",
});

export const GET = routes.GET;
export const PUT = routes.PUT;
export const DELETE = routes.DELETE;
