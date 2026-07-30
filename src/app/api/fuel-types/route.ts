import { collectionRoutes } from "@/server/crudFactory";
import { FuelTypeItem } from "@/types";

export const runtime = "nodejs";

const routes = collectionRoutes<FuelTypeItem>({
  collection: "fuelTypes",
  auditModule: "Fuel Type",
  labelField: "name",
});

export const GET = routes.GET;
export const POST = routes.POST;
