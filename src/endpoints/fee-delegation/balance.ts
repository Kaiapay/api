import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { publicClient } from "@/utils/viem";
import { formatUnits } from "viem";

export class FeePayerBalance extends OpenAPIRoute {
  schema = {
    tags: ["Fee Delegation"],
    summary: "Get fee payer balance",
    security: [],
    responses: {
      "200": {
        description: "Fee payer balance",
        content: {
          "application/json": {
            schema: z
              .object({
                publicAddress: z.string(),
                balance: z.string(),
              })
              .array(),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const [dev, prod] = await Promise.all([
      publicClient.getBalance({
        address: "0x037A4Ed77a30cCEa91B0A299D07034EE5187B186",
      }),
      publicClient.getBalance({
        address: "0xdbf5DA07011aab580873da055dB0B94E98dDEF08",
      }),
    ]);

    return c.json([
      {
        publicAddress: "0x037A4Ed77a30cCEa91B0A299D07034EE5187B186",
        balance: formatUnits(dev, 18),
      },
      {
        publicAddress: "0xdbf5DA07011aab580873da055dB0B94E98dDEF08",
        balance: formatUnits(prod, 18),
      },
    ]);
  }
}
