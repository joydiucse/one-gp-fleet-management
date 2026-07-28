import { itemRoutes } from "@/server/crudFactory";
import { Role } from "@/types";

export const runtime = "nodejs";

const routes = itemRoutes<Role>({
  collection: "roles",
  idPrefix: "ROLE",
  auditModule: "Role",
  labelField: "name",
});

export const GET = routes.GET;
export const PUT = routes.PUT;
export const DELETE = routes.DELETE;
