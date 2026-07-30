import { itemRoutes } from "@/server/crudFactory";
import { Vehicle } from "@/types";

export const runtime = "nodejs";

const routes = itemRoutes<Vehicle>({
  collection: "vehicles",
  auditModule: "Vehicle Master",
  labelField: "vehicleNumber",
});

export const GET = routes.GET;
export const PUT = routes.PUT;
export const DELETE = routes.DELETE;
