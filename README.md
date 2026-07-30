# Fleet Management — Automated Fleet Billing System

Turns approved OneGP vehicle requisitions into monthly vehicle invoices based on trip distance,
vehicle category, fuel type, fixed rent, overtime and approved incidental charges.

A [Next.js](https://nextjs.org) app backed by MySQL via [Prisma](https://www.prisma.io).

## Requirements

- Node.js 20+
- MySQL 8 (Laragon, XAMPP or a standalone server)

## Getting started

1. **Configure the connection.** Copy `.env.example` to `.env` and fill in both
   database URLs. `APP_ENV` picks which one the app, the Prisma CLI and the seed
   script use, so switching environments never means editing a URL:

   ```
   APP_ENV="dev"
   DATABASE_URL_DEV="mysql://root@127.0.0.1:3306/onegp_fleet"
   DATABASE_URL_PROD="mysql://user:password@host:3306/onegp_fleet"
   SESSION_SECRET="a-long-random-value"
   ```

   Laragon/XAMPP defaults to a passwordless `root`. Use
   `mysql://user:password@host:3306/database` otherwise, percent-encoding
   reserved characters in the password (`#` is `%23`, `@` is `%40`).

   `APP_ENV` defaults to `dev` when unset, so a missing value can never mean
   production. `npm run db:seed` clears the tables it fills, so it refuses to run
   with `APP_ENV=prod` unless `SEED_ALLOW_PROD=1` is set as well.

2. **Create the database:**

   ```bash
   mysql -u root -e "CREATE DATABASE onegp_fleet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

3. **Install, migrate and load the starting data:**

   ```bash
   npm install
   npm run db:deploy   # apply migrations
   npm run db:seed     # load data/*.json into MySQL
   ```

4. **Run it:**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3530>. The sign-in screen lists demo accounts.

## Database

The schema lives in [`prisma/schema.prisma`](prisma/schema.prisma) — 16 tables with typed columns,
foreign keys and indexes. Comments in that file explain the non-obvious choices (why business IDs are
the primary keys, why money is `DECIMAL`, why displayed timestamps are stored as strings, and why
trips keep denormalised vehicle/driver snapshots alongside their foreign keys).

| Script | Purpose |
| --- | --- |
| `npm run db:migrate` | Create and apply a migration after editing the schema (development) |
| `npm run db:deploy` | Apply existing migrations without generating new ones (deployment) |
| `npm run db:seed` | Reset the tables to the contents of `data/*.json` |
| `npm run db:reset` | Drop everything, re-run all migrations, then seed |
| `npm run db:studio` | Browse and edit the data in Prisma Studio |

`data/*.json` is the **initial data set**, not the live store — the application reads and writes
MySQL. Re-running `npm run db:seed` discards live data and restores those files' contents, so treat
it as a reset, not a top-up.

### Layout

```
prisma/schema.prisma          the schema
prisma/migrations/            generated migration SQL
prisma/seed.ts                data/*.json -> MySQL importer
src/server/db.ts              PrismaClient (one pool, reused across dev reloads)
src/server/ids.ts             business ID allocation (V-001, R-0001, INV-2026-06-001, ...)
src/server/mappers.ts         database rows <-> the types in src/types/index.ts
src/server/repositories/      one module per collection: queries and business rules
src/server/crudFactory.ts     generic REST handlers for the simple collections
```

API responses match the shapes in [`src/types/index.ts`](src/types/index.ts) exactly, so the entire
UI is unaware of the storage layer.

## Other routes

- `/user-manual` — a public single-page feature list and user manual. It is plain HTML at
  [`public/user-manual/index.html`](public/user-manual/index.html); screenshots are files in
  `public/user-manual/screenshots/` and can be replaced without touching code (see Appendix F on the
  page itself).
- `/in-app-view` — the phone-sized interface for drivers and field staff.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3530 |
| `npm run build` | Generate the Prisma client and build for production |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
