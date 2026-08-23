import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  getPaymentHistory,
  getPaymentSummary,
} from "../controllers/payment-history.controller.js";
import {
  paymentHistoryQuerySchema,
  paymentSummaryQuerySchema,
} from "../schemas/payment-history-query.schema.js";

const router = Router();

// Payment history is a read-only financial reporting view, so it follows the
// same authorization as the dashboard summary (owner and manager only).
const historyRoles = [UserRole.OWNER, UserRole.MANAGER];

router.get(
  "/history",
  authMiddleware(),
  requireRole(...historyRoles),
  validate(paymentHistoryQuerySchema, "query"),
  getPaymentHistory as RequestHandler,
);

router.get(
  "/summary",
  authMiddleware(),
  requireRole(...historyRoles),
  validate(paymentSummaryQuerySchema, "query"),
  getPaymentSummary as RequestHandler,
);

export default router;
