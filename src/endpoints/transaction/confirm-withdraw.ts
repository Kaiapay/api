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

export class ConfirmWithdraw extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Confirm Withdraw",
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
        description: "Withdraw confirmed successfully",
        content: {
          "application/json": {
            schema: z.object({
              message: z.string(),
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
      "404": {
        description: "Transaction not found",
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
    const { transactionId, txHash } = data.body;

    try {
      const tx = await retry(() =>
        publicClient.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        })
      );

      if (tx.error) {
        return c.json(
          {
            code: "TRANSACTION_FETCH_ERROR",
            message: tx.error.message,
          },
          400
        );
      }

      const log = parseEventLogs({
        abi,
        logs: tx.data.logs,
        strict: true,
        eventName: "TokenWithdrawn",
      }).at(0);

      if (!log) {
        return c.json(
          {
            code: "EVENT_NOT_FOUND",
            message: "TokenTransferred event not found in transaction",
          },
          400
        );
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
        if (result.error.message === "Transaction not found") {
          return c.json(
            {
              code: "TRANSACTION_NOT_FOUND",
              message: result.error.message,
            },
            404
          );
        }
        return c.json(
          {
            code: "VALIDATION_ERROR",
            message: result.error.message,
          },
          400
        );
      }

      return c.json({
        message: "Withdraw confirmed successfully",
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
