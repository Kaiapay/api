import { Bool, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { users } from "@/schema";
import { eq } from "drizzle-orm";
import { tryCatch } from "@/utils/try-catch";

export class UpdateKaiapayId extends OpenAPIRoute {
  schema = {
    tags: ["User"],
    summary: "Update Kaiapay ID",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              kaiapayId: z
                .string()
                .min(4, "카이아페이 아이디는 최소 4자 이상 사용할 수 있습니다")
                .max(16, "카이아페이 아이디는 최대 16자까지 사용할 수 있습니다")
                .regex(
                  /^[a-zA-Z0-9가-힣]+$/,
                  "카이아페이 아이디는 한글, 영문, 숫자만 사용할 수 있습니다"
                ),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Kaiapay ID updated successfully",
        content: {
          "application/json": {
            schema: z.object({
              kaiapayId: z.string(),
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
      "409": {
        description: "Conflict - Kaiapay ID already exists",
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
    const { kaiapayId } = data.body;

    try {
      const result = await tryCatch(async () => {
        const existingUser = await c
          .get("db")
          .select()
          .from(users)
          .where(eq(users.kaiapayId, kaiapayId))
          .limit(1);

        if (existingUser.length > 0) {
          throw new Error("Kaiapay ID already exists");
        }

        await c
          .get("db")
          .update(users)
          .set({
            kaiapayId: kaiapayId,
          })
          .where(eq(users.id, c.get("userId")));

        return kaiapayId;
      });

      if (result.error) {
        if (result.error.message === "Kaiapay ID already exists") {
          return c.json(
            {
              code: "KAIA_ID_ALREADY_EXISTS",
              message: result.error.message,
            },
            409
          );
        }
        return c.json(
          {
            code: "UPDATE_FAILED",
            message: result.error.message,
          },
          400
        );
      }

      return c.json({
        kaiapayId: result.data,
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
