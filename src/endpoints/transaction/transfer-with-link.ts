import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { parseEventLogs } from "viem";
import { publicClient } from "@/utils/viem";
import { abi } from "@/utils/abi";
import { transactions, users } from "@/schema";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";
import { retry } from "@/utils/try-catch";
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
                    link: z.string(),
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
    const { amount, token, method } = data.body;

    const { url, publicAddress } = await createTransferLink({
      baseUrl: c.env.LINK_BASE_URL,
    });

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

    await c
      .get("db")
      .insert(transactions)
      .values({
        fromAddress: user.smartWallet.address,
        toAddress: publicAddress,
        token: token as `0x${string}`,
        amount: amount.toString(),
        txHash: null,
        deadline: null, // TODO: 만료 시간 일괄 설정
        status: TxnStatus.pending,
        method: method,
        kind: TxnKind.send_to_temporal,
        canCancel: true,
        senderAlias: userRecord?.kaiapayId,
      });

    return {
      success: true,
      result: {
        link: url,
        publicAddress,
      },
    };
  }
}
