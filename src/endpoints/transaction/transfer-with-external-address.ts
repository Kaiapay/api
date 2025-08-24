import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { transactions, users } from "@/schema";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";
import { eq } from "drizzle-orm";

export class TransferWithExternalAddress extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Transfer with External Address",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              amount: z.string(),
              token: z.string(),
              address: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created transaction",
        content: {
          "application/json": {
            schema: z.object({
              series: z.discriminatedUnion("success", [
                z.object({
                  success: z.literal(true),
                  result: z.object({
                    transactionId: z.string(),
                  }),
                }),
                z.object({
                  success: z.literal(false),
                  error: z.string(),
                }),
              ]),
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
    const { amount, token, address } = data.body;

    const user = await c.get("privy").getUserById(c.get("userId"));

    if (!user.smartWallet?.address) {
      throw new Error("Smart wallet not found");
    }

    const userRecord = (
      await c
        .get("db")
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
    ).at(0);

    const transaction = await c
      .get("db")
      .insert(transactions)
      .values({
        fromAddress: user.smartWallet.address,
        toAddress: address,
        token: token as `0x${string}`,
        amount: amount.toString(),
        txHash: null,
        deadline: null,
        status: TxnStatus.pending,
        method: TxnMethod.wallet,
        kind: TxnKind.withdraw,
        canCancel: false,
        senderAlias: userRecord?.kaiapayId,
      })
      .returning()
      .then((res) => res.at(0));

    if (!transaction) {
      return {
        success: false,
        error: "Transaction not found",
      };
    }

    return {
      success: true,
      result: {
        transactionId: transaction.id,
      },
    };
  }
}
