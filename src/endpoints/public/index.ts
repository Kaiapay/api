import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { PublicTransactionGetByToAddress } from "./get-transaction-by-to-address";
import { PotInfo } from "./pot-info";

const publicRoutes = fromHono(new Hono<ContextType>());

publicRoutes.get("/to-address", PublicTransactionGetByToAddress);
publicRoutes.get("/pot-info", PotInfo);

export default publicRoutes;
