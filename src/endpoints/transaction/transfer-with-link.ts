import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { transactions, users } from "@/schema";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";
import { createTransferLink } from "@/utils/link";
import { eq } from "drizzle-orm";

export class TransferWithLink extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Transfer with Link",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              amount: z.string(),
              token: z.string(),
              method: z.enum([TxnMethod.link, TxnMethod.phone]),
              phone: z.string().optional(),
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
              transactionId: z.string(),
              link: z.string(),
              publicAddress: z.string(),
            }),
          },
        },
      },
      "400": {
        description: "Bad request",
        content: {
          "application/json": {
            schema: z.object({
              code: z.string(),
              message: z.string(),
            }),
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: z.object({
              code: z.string(),
              message: z.string(),
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
    const { amount, token, method, phone } = data.body;

    try {
      const sendingUser = (
        await c
          .get("db")
          .select()
          .from(users)
          .where(eq(users.id, c.get("userId")))
          .limit(1)
      ).at(0);

      const sendingPrivyUser = await c
        .get("privy")
        .getUserById(c.get("userId"));

      if (!sendingPrivyUser.smartWallet?.address) {
        return c.json(
          {
            code: "WALLET_NOT_FOUND",
            message: "Sending user smart wallet not found",
          },
          400
        );
      }

      const link = await createTransferLink({
        baseUrl: c.env.LINK_BASE_URL,
      });

      const transaction = await c
        .get("db")
        .insert(transactions)
        .values({
          fromAddress: sendingPrivyUser.smartWallet.address,
          toAddress: link.publicAddress,
          token: token as `0x${string}`,
          amount: amount.toString(),
          txHash: null,
          deadline: null, // TODO: 만료 시간 일괄 설정
          status: TxnStatus.pending,
          method: method,
          kind: TxnKind.send_to_temporal,
          canCancel: true,
          senderAlias: sendingUser?.kaiapayId,
          recipientAlias: phone
            ? phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4)
            : null,
        })
        .returning()
        .then((res) => res.at(0));

      if (!transaction) {
        return c.json(
          {
            code: "TRANSACTION_CREATION_FAILED",
            message: "Failed to create transaction",
          },
          500
        );
      }

      return c.json({
        transactionId: transaction.id,
        link: link,
        publicAddress: sendingPrivyUser.smartWallet.address,
      });
    } catch (error) {
      return c.json(
        {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        },
        500
      );
    }
  }
}
