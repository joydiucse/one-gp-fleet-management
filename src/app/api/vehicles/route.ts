import { collectionRoutes } from "@/server/crudFactory";
import { Vehicle } from "@/types";

export const runtime = "nodejs";

const routes = collectionRoutes<Vehicle>({
  collection: "vehicles",
  auditModule: "Vehicle Master",
  labelField: "vehicleNumber",
});

export const GET = routes.GET;
export const POST = routes.POST;
