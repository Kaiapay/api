import { PrivyClient } from "@privy-io/server-auth";
import { AppContext } from "../types";

export async function requireAuth(c: AppContext, next: any) {
  let token = null;
  const cookie = c.req.header("cookie");
  let tokenFromCookie = cookie
    .split(";")
    .find((c) => c.trim().startsWith("privy-token="));
  token = tokenFromCookie?.replace("privy-token=", "").trim();

  if (!token) {
    // fallback to bearer auth
    const bearer = c.req.header("Authorization");
    token = bearer?.replace("Bearer ", "").trim();

    if (!token) {
      return c.json({ error: "Unauthorized - Authentication required" }, 401);
    }
  }

  const tokenClaims = await c.get("privy").verifyAuthToken(token);

  if (!tokenClaims) {
    return c.json({ error: "Unauthorized - Authentication required" }, 401);
  }

  c.set("userId", tokenClaims.userId);

  await next();
}

// OpenAPI 보안 스키마
export const securitySchemes = {
  cookieAuth: {
    type: "apiKey",
    in: "cookie",
    name: "privy-token",
    description: "Privy token for authentication",
  },
  bearerAuth: {
    type: "apiKey",
    in: "header",
    name: "Authorization",
    description:
      "Bearer token for authentication (use privy token with 'Bearer ' prefix)",
  },
} as const;
