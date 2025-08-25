import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { transactions, users } from "@/schema";
import { desc, eq, or } from "drizzle-orm";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";

export class TransactionList extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Get transaction list",
    security: [{ cookie: [] }],
    request: {
      query: z.object({
        limit: z.number().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Transaction list",
        content: {
          "application/json": {
            schema: z.object({
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
                  canCancel: z.boolean(),
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
    const data = await this.getValidatedData<typeof this.schema>();
    const { limit } = data.query;

    const userId = c.get("userId");

    const privyUser = await c.get("privy").getUserById(userId);
    const smartWalletAddress = privyUser.smartWallet?.address;

    const transactionRecords = await c.get("db").query.transactions.findMany({
      where: or(
        eq(transactions.fromAddress, smartWalletAddress as `0x${string}`),
        eq(transactions.toAddress, smartWalletAddress as `0x${string}`)
      ),
      orderBy: [desc(transactions.createdAt)],
      limit,
    });

    return {
      transactions: transactionRecords,
    };
  }
}
