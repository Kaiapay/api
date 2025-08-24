import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    schema: "public",
    prefix: "timestamp",
    table: "migrations",
  },
  verbose: true,
  strict: true,
} satisfies Config;
