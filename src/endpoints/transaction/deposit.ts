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
        description: "Deposit processed successfully",
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
    const txHash = data.body.txHash;

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
        eventName: "TokenDeposited",
      }).at(0);

      if (!log) {
        return c.json(
          {
            code: "EVENT_NOT_FOUND",
            message: "TokenDeposited event not found in transaction",
          },
          400
        );
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
          senderAlias:
            log.args.from.slice(0, 4) + "..." + log.args.from.slice(-4),
        })
        .onConflictDoNothing({
          target: [transactions.txHash],
        });

      return c.json({
        message: "Deposit processed successfully",
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
