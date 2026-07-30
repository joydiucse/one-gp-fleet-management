import { collectionRoutes } from "@/server/crudFactory";
import { VehicleCategoryItem } from "@/types";

export const runtime = "nodejs";

const routes = collectionRoutes<VehicleCategoryItem>({
  collection: "vehicleCategories",
  auditModule: "Vehicle Category",
  labelField: "name",
});

export const GET = routes.GET;
export const POST = routes.POST;
