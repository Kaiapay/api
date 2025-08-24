import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { transactions, users } from "@/schema";
import { eq } from "drizzle-orm";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";

export class TransactionGetByToAddress extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Get transaction by to address",
    request: {
      query: z.object({
        address: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Transaction",
        content: {
          "application/json": {
            schema: z.object({
              transaction: z.object({
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
              }),
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
    const { address } = data.query;

    const transaction = await c.get("db").query.transactions.findFirst({
      where: eq(transactions.toAddress, address),
    });

    return c.json({
      transaction,
    });
  }
}
