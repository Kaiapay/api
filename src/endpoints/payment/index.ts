import { fromHono } from "chanfana";

import { ContextType } from "@/types";
import { Hono } from "hono";
import { CreatePayment } from "./create";
import { GetPaymentByCode } from "./get-by-code";

const paymentRoutes = fromHono(new Hono<ContextType>());

paymentRoutes.post("/create", CreatePayment);
paymentRoutes.get("/:code", GetPaymentByCode);

export default paymentRoutes;
