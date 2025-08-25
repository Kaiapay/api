import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "@/types";
import { publicClient } from "@/utils/viem";
import { formatUnits } from "viem";
import { abi } from "@/utils/abi";

export class PotInfo extends OpenAPIRoute {
  schema = {
    tags: ["Public"],
    summary: "Get pot info",
    security: [],
    request: {
      query: z.object({
        address: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Pot info",
        content: {
          "application/json": {
            schema: z
              .object({
                balance: z.string(),
                deadline: z.string(),
                owner: z.string(),
              })
              .array(),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const { address } = data.query;

    const potInfo = await publicClient.readContract({
      address: "0x60f76BAdA29a44143Ee50460284028880d4aB736",
      abi: abi,
      functionName: "getPot",
      args: [
        address as `0x${string}`,
        `0xd077A400968890Eacc75cdc901F0356c943e4fDb`, //usdt
      ],
    });

    return c.json({
      balance: formatUnits(potInfo[0], 6),
      deadline: potInfo[1].toString(),
      owner: potInfo[2],
    });
  }
}
