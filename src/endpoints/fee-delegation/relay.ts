import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { retry } from "@/utils/try-catch";
import { KaiaWalletClient } from "@kaiachain/viem-ext";

export class RelayFeePay extends OpenAPIRoute {
  schema = {
    tags: ["Fee Delegation"],
    summary: "Relay fee pay",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              userSignedTx: z.string(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the relayed transaction hash",
        content: {
          "application/json": {
            schema: z.object({
              hash: z.string(),
            }),
          },
        },
      },
      "500": {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: z.discriminatedUnion("code", [
              z.object({
                code: z.literal("SIGN_ERROR"),
                message: z.string(),
              }),
            ]),
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
    const { userSignedTx } = data.body;

    const result = await retry(async () => {
      const feePayerClient = c.get("feePayerClient") as KaiaWalletClient;

      const feePayerSignedTx = await feePayerClient.signTransactionAsFeePayer(
        userSignedTx
      );
      const sentFeePayerTx = await feePayerClient.request({
        method: "klay_sendRawTransaction",
        params: [feePayerSignedTx],
      });

      return sentFeePayerTx;
    });

    if (result.error) {
      return c.json(
        {
          code: "SIGN_ERROR",
          message: result.error.message,
        },
        500
      );
    }

    return c.json({
      hash: result.data,
    });
  }
}
