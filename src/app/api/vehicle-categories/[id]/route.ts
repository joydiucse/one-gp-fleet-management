import { itemRoutes } from "@/server/crudFactory";
import { VehicleCategoryItem } from "@/types";

export const runtime = "nodejs";

const routes = itemRoutes<VehicleCategoryItem>({
  collection: "vehicleCategories",
  auditModule: "Vehicle Category",
  labelField: "name",
});

export const GET = routes.GET;
export const PUT = routes.PUT;
export const DELETE = routes.DELETE;
