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
        description: "Returns the created task",
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
    const kaiapayId = data.body.kaiapayId;

    const updateKaiapayIdResult = await tryCatch(
      async () =>
        await c.get("db").transaction(async (tx) => {
          // 중복 검사 먼저
          const existingUser = await tx.query.users.findFirst({
            where: eq(users.kaiapayId, kaiapayId),
          });

          if (existingUser) {
            throw new Error("DUPLICATE_KAIAPAY_ID");
          }

          await tx
            .insert(users)
            .values({ kaiapayId, id: c.get("userId") })
            .onConflictDoUpdate({
              target: users.id,
              set: { kaiapayId },
            });
        })
    );

    if (updateKaiapayIdResult.error) {
      switch (updateKaiapayIdResult.error.message) {
        case "DUPLICATE_KAIAPAY_ID":
          return c.json({
            success: false,
            error: "이미 사용중인 카이아페이 아이디입니다",
          });
        default:
          console.error(updateKaiapayIdResult.error);
          return c.json({
            success: false,
            error: "알 수 없는 오류가 발생했습니다",
          });
      }
    }

    return {
      success: true,
      result: {
        kaiapayId,
      },
    };
  }
}
