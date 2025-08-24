import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { Deposit } from "./deposit";
import { TransferWithLink } from "./transfer-with-link";

const transactionRoutes = fromHono(new Hono<ContextType>());

transactionRoutes.post("/deposit", Deposit);
transactionRoutes.post("/transfer-with-link", TransferWithLink);

export default transactionRoutes;
