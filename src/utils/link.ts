import bs58 from "bs58";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// privateKey를 압축하여 짧은 문자열로 변환 (base58 사용)
const compressPrivateKey = (privateKey: `0x${string}`): string => {
  return bs58.encode(Buffer.from(privateKey.slice(2), "hex"));
};

export const createTransferLink = async (params: {
  baseUrl: string;
}): Promise<{
  url: string;
  publicAddress: `0x${string}`;
}> => {
  const privateKey = generatePrivateKey();
  const compressedKey = compressPrivateKey(privateKey);
  const account = privateKeyToAccount(privateKey);

  return {
    url: `${params.baseUrl}/i/${compressedKey}`, // 서버에 저장되지 않고, 프론트로 내려보내기만 함
    publicAddress: account.address,
  };
};
