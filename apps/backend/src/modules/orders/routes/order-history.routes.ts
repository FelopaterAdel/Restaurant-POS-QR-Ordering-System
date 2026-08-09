import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { getOrderHistory } from "../controllers/order-history.controller.js";
import { orderHistoryQuerySchema } from "../schemas/order-history-query.schema.js";

const router = Router();

const historyRoles = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER];

router.get(
  "/",
  authMiddleware(),
  requireRole(...historyRoles),
  validate(orderHistoryQuerySchema, "query"),
  getOrderHistory as RequestHandler,
);

export default router;
