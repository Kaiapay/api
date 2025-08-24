import { PrivyClient } from "@privy-io/server-auth";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import * as schema from "./schema";

export type AppContext = Context<ContextType>;

export type DB = ReturnType<typeof drizzle<typeof schema>>;

export interface Variables {
  db: DB;
  privy: PrivyClient;
  userId: string;
}

export interface ContextType {
  Bindings: Env;
  Variables: Variables;
}
