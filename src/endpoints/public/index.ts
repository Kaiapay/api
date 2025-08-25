import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { PublicTransactionGetByToAddress } from "./get-transaction-by-to-address";

const publicRoutes = fromHono(new Hono<ContextType>());

publicRoutes.get("/to-address", PublicTransactionGetByToAddress);

export default publicRoutes;
