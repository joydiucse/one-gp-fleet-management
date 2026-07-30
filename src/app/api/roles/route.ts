import { collectionRoutes } from "@/server/crudFactory";
import { Role } from "@/types";

export const runtime = "nodejs";

const routes = collectionRoutes<Role>({
  collection: "roles",
  auditModule: "Role",
  labelField: "name",
});

export const GET = routes.GET;
export const POST = routes.POST;
