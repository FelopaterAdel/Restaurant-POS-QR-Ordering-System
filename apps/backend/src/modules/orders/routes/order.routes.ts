import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  completeOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { updateOrderStatusSchema } from "../schemas/update-order-status.schema.js";

const router = Router();

const viewRoles = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.KITCHEN,
  UserRole.WAITER,
];

const changeStatusRoles = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.KITCHEN,
  UserRole.WAITER,
];

const completeRoles = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER];

router.get(
  "/",
  authMiddleware(),
  requireRole(...viewRoles),
  listOrders as RequestHandler,
);
router.get(
  "/:id",
  authMiddleware(),
  requireRole(...viewRoles),
  getOrder as RequestHandler,
);
router.patch(
  "/:id/status",
  authMiddleware(),
  requireRole(...changeStatusRoles),
  validate(updateOrderStatusSchema, "body"),
  updateOrderStatus as RequestHandler,
);
router.post(
  "/:id/complete",
  authMiddleware(),
  requireRole(...completeRoles),
  completeOrder as RequestHandler,
);

export default router;
