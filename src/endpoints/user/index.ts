import { fromHono } from "chanfana";
import { UserMe } from "./me";
import { UpdateKaiapayId } from "./update-kaiapay-id";
import { ContextType } from "@/types";
import { Hono } from "hono";
import { requireAuth } from "@/utils/auth";

const userRoutes = fromHono(new Hono<ContextType>());
userRoutes.use(requireAuth);
userRoutes.get("/me", UserMe);
userRoutes.put("/update-kaiapay-id", UpdateKaiapayId);

export default userRoutes;
