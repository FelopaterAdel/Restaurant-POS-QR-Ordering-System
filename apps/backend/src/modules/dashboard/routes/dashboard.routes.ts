import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  getDashboardSummary,
  getRevenueTrend,
  getStockSummary,
  getTopProducts,
} from "../controllers/dashboard.controller.js";
import { dashboardQuerySchema } from "../schemas/dashboard-query.schema.js";
import {
  revenueTrendQuerySchema,
  topProductsQuerySchema,
} from "../schemas/analytics-query.schema.js";

const router = Router();

const dashboardRoles = [UserRole.OWNER, UserRole.MANAGER];

router.get(
  "/summary",
  authMiddleware(),
  requireRole(...dashboardRoles),
  validate(dashboardQuerySchema, "query"),
  getDashboardSummary as RequestHandler,
);
router.get(
  "/top-products",
  authMiddleware(),
  requireRole(...dashboardRoles),
  validate(topProductsQuerySchema, "query"),
  getTopProducts as RequestHandler,
);
router.get(
  "/revenue",
  authMiddleware(),
  requireRole(...dashboardRoles),
  validate(revenueTrendQuerySchema, "query"),
  getRevenueTrend as RequestHandler,
);
router.get(
  "/stock",
  authMiddleware(),
  requireRole(...dashboardRoles),
  getStockSummary as RequestHandler,
);

export default router;
