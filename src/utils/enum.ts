export enum Currency {
  USDT = "USDT",
  KAIA = "KAIA",
}

export enum TxnKind {
  send_to_user = "send_to_user",
  send_to_temporal = "send_to_temporal",
  receive = "receive",
  interest = "interest",
  payment = "payment",
  withdraw = "withdraw",
  deposit = "deposit",
}

export enum TxnMethod {
  link = "link",
  kaiapayId = "kaiapayId", // kaiapay id
  phone = "phone",
  wallet = "wallet",
  luckybox = "luckybox",
  interest = "interest",
  payment = "payment",
}

export enum TxnStatus {
  pending = "pending",
  processing = "processing",
  success = "success",
  canceled = "canceled",
  failed = "failed",
  expired = "expired",
}
