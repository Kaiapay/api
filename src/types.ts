import { PrivyClient } from "@privy-io/server-auth";
import { DateTime, Str } from "chanfana";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Context } from "hono";
import { z } from "zod";
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

export const Task = z.object({
  name: Str({ example: "lorem" }),
  slug: Str(),
  description: Str({ required: false }),
  completed: z.boolean().default(false),
  due_date: DateTime(),
});
