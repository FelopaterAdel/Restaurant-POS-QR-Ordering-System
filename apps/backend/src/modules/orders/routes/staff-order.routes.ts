import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { getStaffOrderDetails } from "../controllers/staff-order.controller.js";

const router = Router();

const staffRoles = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
];

router.get(
  "/:orderId",
  authMiddleware(),
  requireRole(...staffRoles),
  getStaffOrderDetails as RequestHandler,
);

export default router;
