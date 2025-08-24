import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { RelayFeePay } from "./relay";

const feeDelegationRoutes = fromHono(new Hono<ContextType>());

feeDelegationRoutes.post("/relay", RelayFeePay);

export default feeDelegationRoutes;
