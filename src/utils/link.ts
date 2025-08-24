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
  console.log(privateKey);
  const compressedKey = compressPrivateKey(privateKey);
  const account = privateKeyToAccount(privateKey);

  return {
    url: `${params.baseUrl}/i/${compressedKey}`, // 서버에 저장되지 않고, 프론트로 내려보내기만 함
    publicAddress: account.address,
  };
};

// 압축된 키로부터 privateKey 복원 (자동 감지)
// TODO: 이건 프론트에서만 사용하는 것
// 압축된 문자열을 다시 privateKey로 복원 (base58)
const getAccountFromCompressed = (compressedKey: string) => {
  try {
    // base58 디코딩
    const privateKeyBytes = bs58.decode(compressedKey);

    // hex 문자열로 변환하고 0x 접두사 추가
    const privateKeyHex = Buffer.from(privateKeyBytes).toString("hex");
    const privateKey = `0x${privateKeyHex}`;
    const publicAddress = getAddress(privateKey);

    return {
      privateKey,
      publicAddress,
    };
  } catch (error) {
    throw new Error(`Failed to decompress private key from: ${compressedKey}`);
  }
};
