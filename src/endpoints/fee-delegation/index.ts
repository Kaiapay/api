import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { RelayFeePay } from "./relay";
import { FeePayerBalance } from "./balance";

const feeDelegationRoutes = fromHono(new Hono<ContextType>());

feeDelegationRoutes.post("/relay", RelayFeePay);
feeDelegationRoutes.get("/balance", FeePayerBalance);

export default feeDelegationRoutes;
