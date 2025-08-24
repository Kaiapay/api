import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";

const transactionRoutes = fromHono(new Hono<ContextType>());

transactionRoutes.post("/deposit", UserMe);

export default transactionRoutes;
