/**
 * Which environment the app runs against, and the matching connection URL.
 *
 * `APP_ENV` selects between the two URLs in .env so the same build can point at
 * either database without editing `DATABASE_URL`. This is the single resolver
 * used by the runtime client, the Prisma CLI config and the seed script, so all
 * three always agree on which database is in play.
 */

export type AppEnv = "dev" | "prod";

const URL_KEY: Record<AppEnv, string> = {
  dev: "DATABASE_URL_DEV",
  prod: "DATABASE_URL_PROD",
};

/** `APP_ENV`, defaulting to `dev` so a missing value can never mean production. */
export function appEnv(): AppEnv {
  const value = (process.env.APP_ENV ?? "dev").trim().toLowerCase();
  if (value !== "dev" && value !== "prod") {
    throw new Error(`APP_ENV must be "dev" or "prod", got "${process.env.APP_ENV}".`);
  }
  return value;
}

/**
 * The connection URL for the active environment. Falls back to `DATABASE_URL`
 * so an .env written before the split keeps working.
 */
export function databaseUrl(): string {
  const env = appEnv();
  const url = process.env[URL_KEY[env]] ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      `${URL_KEY[env]} is not set (APP_ENV=${env}). Copy .env.example to .env and fill it in.`
    );
  }
  return url;
}
