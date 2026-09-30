import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import {
  approveRefund,
  listRefunds,
  rejectRefund,
  requestRefund,
} from "../controllers/refund.controller.js";
import { listRefundsQuerySchema } from "../schemas/list-refunds-query.schema.js";
import { requestRefundSchema } from "../schemas/request-refund.schema.js";
import { reviewRefundSchema } from "../schemas/review-refund.schema.js";

const router = Router();

const requestRoles = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER];
const reviewRoles = [UserRole.OWNER, UserRole.MANAGER];

router.get(
  "/",
  authMiddleware(),
  requireRole(...reviewRoles),
  validate(listRefundsQuerySchema, "query"),
  listRefunds as RequestHandler,
);
router.post(
  "/",
  authMiddleware(),
  requireRole(...requestRoles),
  validate(requestRefundSchema, "body"),
  requestRefund as RequestHandler,
);
router.post(
  "/:id/approve",
  authMiddleware(),
  requireRole(...reviewRoles),
  validate(idParamSchema(), "params"),
  validate(reviewRefundSchema, "body"),
  approveRefund as RequestHandler,
);
router.post(
  "/:id/reject",
  authMiddleware(),
  requireRole(...reviewRoles),
  validate(idParamSchema(), "params"),
  validate(reviewRefundSchema, "body"),
  rejectRefund as RequestHandler,
);

export default router;
