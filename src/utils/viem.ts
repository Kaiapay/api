import { createPublicClient, http } from "viem";
import { kaia } from "viem/chains";

export const publicClient = createPublicClient({
  chain: kaia,
  transport: http(
    "https://1.rpc.thirdweb.com/f00f9bfe16df51cdf033331e0d62ca76"
  ),
});
