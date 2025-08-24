import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { transactions, users } from "@/schema";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";
import { eq } from "drizzle-orm";

export class TransferWithKaiapayId extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Transfer with Kaia ID",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              amount: z.string(),
              token: z.string(),
              kaiapayId: z.string(),
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
                    publicAddress: z.string(),
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
    const { amount, token, kaiapayId } = data.body;

    // kaiapayId 로 사용자 조회
    const receivingUser = (
      await c
        .get("db")
        .select()
        .from(users)
        .where(eq(users.kaiapayId, kaiapayId))
        .limit(1)
    ).at(0);

    if (!receivingUser) {
      return {
        success: false,
        error: "Kaiapay ID not found",
      };
    }

    const sendingUser = (
      await c
        .get("db")
        .select()
        .from(users)
        .where(eq(users.id, c.get("userId")))
        .limit(1)
    ).at(0);

    const sendingPrivyUser = await c.get("privy").getUserById(c.get("userId"));
    const receivingPrivyUser = await c
      .get("privy")
      .getUserById(receivingUser.id);

    if (!receivingPrivyUser.smartWallet?.address) {
      return {
        success: false,
        error: "Receiving user smart wallet not found",
      };
    }

    if (!sendingPrivyUser.smartWallet?.address) {
      return {
        success: false,
        error: "Sending user smart wallet not found",
      };
    }

    const transaction = await c
      .get("db")
      .insert(transactions)
      .values({
        fromAddress: sendingPrivyUser.smartWallet.address,
        toAddress: receivingPrivyUser.smartWallet.address,
        token: token as `0x${string}`,
        amount: amount.toString(),
        txHash: null,
        deadline: null, // TODO: 만료 시간 일괄 설정
        status: TxnStatus.pending,
        method: TxnMethod.kaiapayId,
        kind: TxnKind.send_to_user,
        canCancel: false,
        senderAlias: sendingUser?.kaiapayId,
        recipientAlias: receivingUser.kaiapayId,
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
        publicAddress: receivingPrivyUser.smartWallet.address,
      },
    };
  }
}
