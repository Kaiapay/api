import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { Deposit } from "./deposit";

const transactionRoutes = fromHono(new Hono<ContextType>());

transactionRoutes.post("/deposit", Deposit);

export default transactionRoutes;
