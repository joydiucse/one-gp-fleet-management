import "dotenv/config";
import { defineConfig } from "prisma/config";
import { databaseUrl } from "./src/server/databaseUrl";

// Prisma 7 moved the migration/introspection connection URL out of
// schema.prisma and into this file. The runtime connection is made separately
// by the driver adapter in src/server/db.ts.
//
// Both read the URL through the same resolver, so `APP_ENV` decides which
// database migrations and the app itself talk to.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl(),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
});
