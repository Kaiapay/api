import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { users } from "@/schema";
import { eq } from "drizzle-orm";
import { tryCatch } from "@/utils/try-catch";
import { kaia } from "viem/chains";
import { createPublicClient, http } from "viem";
import { publicClient } from "@/utils/viem";

export class Deposit extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Deposit",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              txHash: z.string(),
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
                    kaiapayId: z.string(),
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
    const txHash = data.body.txHash;

    const tx = await publicClient.getTransaction({
      hash: txHash as `0x${string}`,
    });
    console.log(tx);
    // parse event from tx

    return {
      success: true,
      result: {},
    };
  }
}
