import { collectionRoutes } from "@/server/crudFactory";
import { Requisition } from "@/types";

export const runtime = "nodejs";

const routes = collectionRoutes<Requisition>({
  collection: "requisitions",
  idPrefix: "R",
  auditModule: "Trip Requisition",
  labelField: "ticketId",
});

export const GET = routes.GET;
export const POST = routes.POST;
