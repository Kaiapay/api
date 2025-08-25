import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { transactions, users } from "@/schema";
import { TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";
import { createTransferLink } from "@/utils/link";
import { eq } from "drizzle-orm";
import { parseEventLogs } from "viem";
import { abi } from "@/utils/abi";
import { retry } from "@/utils/try-catch";
import { publicClient } from "@/utils/viem";

export class TransferFromLink extends OpenAPIRoute {
  schema = {
    tags: ["Transaction"],
    summary: "Transfer from Link",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              prevTransactionId: z.string(),
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
              transactionId: z.string(),
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
    const { prevTransactionId, txHash } = data.body;

    const receivingPrivyUser = await c
      .get("privy")
      .getUserById(c.get("userId"));
    const recevingAddress = receivingPrivyUser.smartWallet?.address;
    if (!recevingAddress) {
      return c.json(
        {
          code: "WALLET_NOT_FOUND",
          message: "Receiving user smart wallet not found",
        },
        400
      );
    }

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
      eventName: "TokenTransferred",
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

    const result = await c.get("db").transaction(async (tx) => {
      const prevTransaction = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, prevTransactionId))
        .limit(1)
        .then((res) => res.at(0));

      if (!prevTransaction) {
        throw new Error("PREV_TRANSACTION_NOT_FOUND");
      }

      if (log.args.from !== prevTransaction.toAddress) {
        throw new Error("FROM_ADDRESS_MISMATCH");
      }

      if (log.args.to !== recevingAddress) {
        throw new Error("TO_ADDRESS_MISMATCH");
      }

      // update prev transaction to uncancellable
      await tx
        .update(transactions)
        .set({
          canCancel: false,
        })
        .where(eq(transactions.id, prevTransactionId));

      const transaction = await tx
        .insert(transactions)
        .values({
          fromAddress: prevTransaction.toAddress,
          toAddress: log.args.to,
          token: prevTransaction.token,
          amount: log.args.amount.toString(),
          txHash: txHash,
          deadline: null,
          status: TxnStatus.success,
          method: TxnMethod.link,
          kind: TxnKind.receive,
          canCancel: false,
          senderAlias: prevTransaction.senderAlias,
          recipientAlias: null, // 나에게 도착한 것이므로 null로 처리
        })
        .returning()
        .then((res) => res.at(0));

      if (!transaction) {
        throw new Error("TRANSACTION_CREATION_FAILED");
      }

      return {
        transactionId: transaction.id,
      };
    });

    return c.json({
      transactionId: result.transactionId,
    });
  }
}
