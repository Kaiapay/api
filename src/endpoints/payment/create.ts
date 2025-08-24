import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { parseEventLogs } from "viem";
import { publicClient } from "@/utils/viem";
import { abi } from "@/utils/abi";
import { payments, transactions } from "@/schema";
import { Currency, TxnKind, TxnMethod, TxnStatus } from "@/utils/enum";
import { retry } from "@/utils/try-catch";
import { eq } from "drizzle-orm";

export class CreatePayment extends OpenAPIRoute {
  schema = {
    tags: ["Payment"],
    summary: "Create Payment",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              title: z.string(),
              amount: z.string().nullable(),
              currency: z
                .enum(Object.values(Currency) as [string, ...string[]])
                .nullable(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created payment",
        content: {
          "application/json": {
            schema: z.object({
              series: z.discriminatedUnion("success", [
                z.object({
                  success: z.literal(true),
                  result: z.object({
                    url: z.string(),
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
    const { title, amount, currency } = data.body;

    const createdPayment = await c.get("db").transaction(async (tx) => {
      const code = await retry(async () => {
        const code = Array.from({ length: 10 }, () => {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          return chars.charAt(Math.floor(Math.random() * chars.length));
        }).join("");

        const codeExists = await tx
          .select()
          .from(payments)
          .where(eq(payments.code, code));

        if (codeExists.length > 0) {
          throw new Error("Code already exists");
        }

        return code;
      });

      if (code.error) {
        throw code.error;
      }

      const createdPayment = await tx
        .insert(payments)
        .values({
          title,
          amount: amount ? amount.toString() : null,
          currency: currency ? (currency as Currency) : null,
          code: code.data,
          receiverUserId: c.get("userId"),
        })
        .returning()
        .then(([payment]) => payment!);

      return createdPayment;
    });

    return {
      success: true,
      result: {
        url: `${c.env.LINK_BASE_URL}/p/${createdPayment.code}`,
      },
    };
  }
}
