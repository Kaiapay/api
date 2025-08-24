import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { parseEventLogs } from "viem";
import { publicClient } from "@/utils/viem";
import { abi } from "@/utils/abi";
import { transactions } from "@/schema";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";
import { retry } from "@/utils/try-catch";

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

    const tx = await retry(() =>
      publicClient.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      })
    );

    if (tx.error) {
      return {
        success: false,
        error: tx.error.message,
      };
    }

    const log = parseEventLogs({
      abi,
      logs: tx.data.logs,
      strict: true,
      eventName: "TokenDeposited",
    }).at(0);

    if (!log) {
      return {
        success: false,
        error: "TokenDeposited event not found in transaction",
      };
    }

    await c
      .get("db")
      .insert(transactions)
      .values({
        fromAddress: log.args.from,
        toAddress: log.args.to,
        token: log.args.token,
        amount: log.args.amount.toString(),
        txHash: txHash,
        status: TxnStatus.success,
        method: TxnMethod.wallet,
        kind: TxnKind.deposit,
        canCancel: false,
      })
      .onConflictDoNothing({
        target: [transactions.txHash],
      });

    return {
      success: true,
      result: {},
    };
  }
}
