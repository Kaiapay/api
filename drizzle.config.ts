import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .dev.vars
dotenv.config({ path: ".dev.vars" });

export default {
  schema: "./src/db/schema.ts",
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
