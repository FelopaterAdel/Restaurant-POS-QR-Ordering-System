import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { getLoyaltyBalance } from "../controllers/loyalty.controller.js";
import { loyaltyBalanceQuerySchema } from "../schemas/loyalty-balance-query.schema.js";

const router = Router();

const readRoles = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
];

router.get(
  "/",
  authMiddleware(),
  requireRole(...readRoles),
  validate(loyaltyBalanceQuerySchema, "query"),
  getLoyaltyBalance as RequestHandler,
);

export default router;
