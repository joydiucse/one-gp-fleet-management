import { collectionRoutes } from "@/server/crudFactory";
import { RateCard } from "@/types";

export const runtime = "nodejs";

const routes = collectionRoutes<RateCard>({
  collection: "rateCards",
  auditModule: "Rate Card",
  labelField: "category",
});

export const GET = routes.GET;
export const POST = routes.POST;
