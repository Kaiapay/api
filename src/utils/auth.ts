import { PrivyClient } from "@privy-io/server-auth";
import { AppContext } from "../types";

export async function requireAuth(c: AppContext, next: any) {
  const privyAppId = await c.env.PRIVY_APP_ID.get();
  const privyAppSecret = await c.env.PRIVY_APP_SECRET.get();

  const privy = new PrivyClient(privyAppId, privyAppSecret);
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

  const tokenClaims = await privy.verifyAuthToken(token);

  if (!tokenClaims) {
    return c.json({ error: "Unauthorized - Authentication required" }, 401);
  }

  const user = await privy.getUserById(tokenClaims.userId);

  c.set("user", user);

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
