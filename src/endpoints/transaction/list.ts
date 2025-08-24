import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { users } from "@/schema";
import { eq } from "drizzle-orm";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";

export class TransactionList extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Get transaction list",
    security: [{ cookie: [] }],
    request: {
      query: z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
      }),
    },
    responses: {
      "200": {
        description: "Transaction list",
        content: {
          "application/json": {
            schema: z.object({
              hasNext: z.boolean(),
              transactions: z.array(
                z.object({
                  id: z.string(),
                  amount: z.string(),
                  token: z.string(),
                  fromAddress: z.string(),
                  toAddress: z.string(),
                  senderAlias: z.string(),
                  recipientAlias: z.string(),
                  status: z.nativeEnum(TxnStatus),
                  method: z.nativeEnum(TxnMethod),
                  kind: z.nativeEnum(TxnKind),
                  updatedAt: z.string(),
                })
              ),
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
