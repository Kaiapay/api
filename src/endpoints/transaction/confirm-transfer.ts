import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { parseEventLogs } from "viem";
import { publicClient } from "@/utils/viem";
import { abi } from "@/utils/abi";
import { transactions } from "@/schema";
import { TxnStatus } from "@/utils/enum";
import { retry, tryCatch } from "@/utils/try-catch";
import { eq } from "drizzle-orm";

export class ConfirmTransfer extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Confirm Transfer",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              transactionId: z.string(),
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
    const { transactionId, txHash } = data.body;

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
      eventName: "TokenTransferred",
    }).at(0);

    if (!log) {
      return {
        success: false,
        error: "TokenTransferred event not found in transaction",
      };
    }

    const result = await tryCatch(
      async () =>
        await c.get("db").transaction(async (tx) => {
          // get current transaction
          const transaction = await tx
            .select()
            .from(transactions)
            .where(eq(transactions.id, transactionId))
            .limit(1)
            .then((res) => res.at(0));

          if (!transaction) {
            throw new Error("Transaction not found");
          }

          // check values
          if (log.args.amount.toString() !== transaction.amount) {
            throw new Error("AMOUNT_MISMATCH");
          }
          if (log.args.token !== transaction.token) {
            throw new Error("TOKEN_MISMATCH");
          }
          if (log.args.from !== transaction.fromAddress) {
            throw new Error("FROM_ADDRESS_MISMATCH");
          }
          if (log.args.to !== transaction.toAddress) {
            throw new Error("TO_ADDRESS_MISMATCH");
          }

          // update transaction
          await tx
            .update(transactions)
            .set({
              txHash: txHash,
              status: TxnStatus.success,
            })
            .where(eq(transactions.id, transactionId));
        })
    );

    if (result.error) {
      await c
        .get("db")
        .update(transactions)
        .set({
          txHash: txHash,
          status: TxnStatus.failed,
        })
        .where(eq(transactions.id, transactionId));
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
    };
  }
}
