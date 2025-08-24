import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { Deposit } from "./deposit";
import { TransferWithLink } from "./transfer-with-link";
import { TransferWithKaiapayId } from "./transfer-with-kaiapay-id";
import { ConfirmTransfer } from "./confirm-transfer";
import { TransferWithExternalAddress } from "./transfer-with-external-address";
import { TransactionGetById } from "./get-by-id";
import { TransactionGetByToAddress } from "./get-by-to-address";

const transactionRoutes = fromHono(new Hono<ContextType>());

transactionRoutes.post("/deposit", Deposit);
transactionRoutes.post("/transfer-with-link", TransferWithLink);
transactionRoutes.post("/transfer-with-kaiapay-id", TransferWithKaiapayId);
transactionRoutes.post("/confirm-transfer", ConfirmTransfer);
transactionRoutes.post(
  "/transfer-with-external-address",
  TransferWithExternalAddress
);
transactionRoutes.get("/to-address", TransactionGetByToAddress);
transactionRoutes.get("/:id", TransactionGetById);

export default transactionRoutes;
