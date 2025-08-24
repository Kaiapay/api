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
            schema: z.discriminatedUnion("success", [
              z.object({
                success: z.literal(true),
                result: z.object({
                  hash: z.string(),
                }),
              }),
              z.object({
                success: z.literal(false),
                error: z.string(),
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

      const feePayerSigned = await feePayerClient.signTransactionAsFeePayer(
        userSignedTx
      );

      const hash = await feePayerClient.request({
        method: "klay_sendRawTransaction",
        params: [feePayerSigned],
      });

      return hash;
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      result: {
        hash: result.data,
      },
    };
  }
}
