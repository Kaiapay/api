import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { User } from "@privy-io/server-auth";
import { users } from "@/schema";
import { eq } from "drizzle-orm";

const UserSchema = z.custom<User>((val) => val as User);

export class UserMe extends OpenAPIRoute {
  schema = {
    tags: ["User"],
    summary: "Get current user",
    security: [{ cookie: [] }],
    responses: {
      "200": {
        description: "User information",
        content: {
          "application/json": {
            schema: z.object({
              user: UserSchema,
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized - Authentication required",
        content: {
          "application/json": {
            schema: z.object({
              error: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const userId = c.get("userId");

    const privyUser = await c.get("privy").getUserById(userId);

    const user = await c.get("db").query.users.findFirst({
      where: eq(users.id, userId),
    });

    return {
      privyUser,
      user,
    };
  }
}
