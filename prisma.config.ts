import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the migration/introspection connection URL out of
// schema.prisma and into this file. The runtime connection is made separately
// by the driver adapter in src/server/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
});
