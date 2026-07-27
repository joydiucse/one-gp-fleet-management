import { itemRoutes } from "@/server/crudFactory";
import { Requisition } from "@/types";

export const runtime = "nodejs";

const routes = itemRoutes<Requisition>({
  collection: "requisitions",
  idPrefix: "R",
  auditModule: "Trip Requisition",
  labelField: "ticketId",
});

export const GET = routes.GET;
export const PUT = routes.PUT;
export const DELETE = routes.DELETE;
