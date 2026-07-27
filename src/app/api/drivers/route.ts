import { collectionRoutes } from "@/server/crudFactory";
import { Driver } from "@/types";

export const runtime = "nodejs";

const routes = collectionRoutes<Driver>({
  collection: "drivers",
  idPrefix: "D",
  auditModule: "Driver Master",
  labelField: "name",
});

export const GET = routes.GET;
export const POST = routes.POST;
