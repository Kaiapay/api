import { fromHono } from "chanfana";
import { Hono } from "hono";
import { requireAuth, securitySchemes } from "./utils/auth";
import { drizzle } from "drizzle-orm/postgres-js";
import { ContextType } from "./types";
import * as schema from "./schema";
import { cors } from "hono/cors";
import { PrivyClient } from "@privy-io/server-auth";
import userRoutes from "./endpoints/user";
import transactionRoutes from "./endpoints/transaction";
import scalar from "./utils/scalar";
import paymentRoutes from "./endpoints/payment";

const app = new Hono<ContextType>();

// Scalar API Documentation
app.get("/", async (c) => {
  return c.html(scalar);
});

app.use("/*", cors());

const api = fromHono<Hono<ContextType>>(app, {
  openapi_url: "/openapi.json",
  schema: {
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  },
});

api.registry.registerComponent(
  "securitySchemes",
  "cookieAuth",
  securitySchemes.cookieAuth
);

api.registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  securitySchemes.bearerAuth
);

api.use("*", async (c, next) => {
  c.set("db", drizzle(c.env.DATABASE.connectionString, { schema }));
  const privyAppId = await c.env.PRIVY_APP_ID.get();
  const privyAppSecret = await c.env.PRIVY_APP_SECRET.get();
  c.set("privy", new PrivyClient(privyAppId, privyAppSecret));
  return next();
});

api.get("/api/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() })
);

api.use("/api/*", requireAuth);

api.route("/api/user", userRoutes);
api.route("/api/transaction", transactionRoutes);
api.route("/api/payment", paymentRoutes);

export default app;
