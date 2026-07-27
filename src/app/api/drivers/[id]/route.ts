import { itemRoutes } from "@/server/crudFactory";
import { Driver } from "@/types";

export const runtime = "nodejs";

const routes = itemRoutes<Driver>({
  collection: "drivers",
  idPrefix: "D",
  auditModule: "Driver Master",
  labelField: "name",
});

export const GET = routes.GET;
export const PUT = routes.PUT;
export const DELETE = routes.DELETE;
