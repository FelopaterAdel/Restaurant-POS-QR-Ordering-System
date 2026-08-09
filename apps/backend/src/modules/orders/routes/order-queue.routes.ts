import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { getOrderQueue } from "../controllers/order-queue.controller.js";
import { getOrderQueueSchema } from "../schemas/get-order-queue.schema.js";

const router = Router();

const queueRoles = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
];

router.get(
  "/",
  authMiddleware(),
  requireRole(...queueRoles),
  validate(getOrderQueueSchema, "query"),
  getOrderQueue as RequestHandler,
);

export default router;
