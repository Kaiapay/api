import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { payments, users } from "@/schema";
import { eq } from "drizzle-orm";

export class GetPaymentByCode extends OpenAPIRoute {
  schema = {
    tags: ["Payment"],
    summary: "Get payment by code",
    request: {
      params: z.object({
        code: z.string().nonempty(),
      }),
    },
    responses: {
      "200": {
        description: "Payment information",
        content: {
          "application/json": {
            schema: z.object({
              payment: z.object({
                code: z.string(),
                title: z.string(),
                amount: z.string().optional(),
                currency: z.string().optional(),
                receiverAddress: z.string(),
              }),
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
    const code = data.params.code;

    const payment = await c.get("db").query.payments.findFirst({
      where: eq(payments.code, code),
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    const privyUser = await c.get("privy").getUserById(payment.receiverUserId);

    if (!privyUser.smartWallet?.address) {
      throw new Error("Receiver address not found");
    }

    return {
      payment: {
        code: payment.code,
        title: payment.title,
        amount: payment.amount,
        currency: payment.currency,
        receiverAddress: privyUser.smartWallet.address,
      },
    };
  }
}
