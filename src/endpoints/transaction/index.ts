import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { Deposit } from "./deposit";
import { TransferWithLink } from "./transfer-with-link";
import { TransferWithKaiapayId } from "./transfer-with-kaiapay-id";
import { ConfirmTransfer } from "./confirm-transfer";

const transactionRoutes = fromHono(new Hono<ContextType>());

transactionRoutes.post("/deposit", Deposit);
transactionRoutes.post("/transfer-with-link", TransferWithLink);
transactionRoutes.post("/transfer-with-kaiapay-id", TransferWithKaiapayId);
transactionRoutes.post("/confirm-transfer", ConfirmTransfer);

export default transactionRoutes;
