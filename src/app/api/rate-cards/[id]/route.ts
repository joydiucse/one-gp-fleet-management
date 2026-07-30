import { itemRoutes } from "@/server/crudFactory";
import { RateCard } from "@/types";

export const runtime = "nodejs";

const routes = itemRoutes<RateCard>({
  collection: "rateCards",
  auditModule: "Rate Card",
  labelField: "category",
});

export const GET = routes.GET;
export const PUT = routes.PUT;
export const DELETE = routes.DELETE;
