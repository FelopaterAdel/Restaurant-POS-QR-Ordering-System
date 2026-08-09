import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import {
  completeOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { cancelOrder } from "../controllers/cancel-order.controller.js";
import { cancelOrderSchema } from "../schemas/cancel-order.schema.js";
import { listOrdersSchema } from "../schemas/list-orders.schema.js";
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

const cancelRoles = [UserRole.OWNER, UserRole.MANAGER];

router.get(
  "/",
  authMiddleware(),
  requireRole(...viewRoles),
  validate(listOrdersSchema, "query"),
  listOrders as RequestHandler,
);
router.get(
  "/:id",
  authMiddleware(),
  requireRole(...viewRoles),
  validate(idParamSchema(), "params"),
  getOrder as RequestHandler,
);
router.patch(
  "/:id/status",
  authMiddleware(),
  requireRole(...changeStatusRoles),
  validate(idParamSchema(), "params"),
  validate(updateOrderStatusSchema, "body"),
  updateOrderStatus as RequestHandler,
);
router.post(
  "/:id/complete",
  authMiddleware(),
  requireRole(...completeRoles),
  validate(idParamSchema(), "params"),
  completeOrder as RequestHandler,
);
router.patch(
  "/:id/cancel",
  authMiddleware(),
  requireRole(...cancelRoles),
  validate(idParamSchema(), "params"),
  validate(cancelOrderSchema, "body"),
  cancelOrder as RequestHandler,
);

export default router;
