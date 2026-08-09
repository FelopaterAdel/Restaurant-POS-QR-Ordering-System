import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import { payOrder } from "../controllers/payment.controller.js";
import { createPaymentSchema } from "../schemas/create-payment.schema.js";

const router = Router();

const payRoles = [UserRole.OWNER, UserRole.MANAGER, UserRole.CASHIER];

router.post(
  "/:orderId/payment",
  authMiddleware(),
  requireRole(...payRoles),
  validate(idParamSchema("orderId"), "params"),
  validate(createPaymentSchema, "body"),
  payOrder as RequestHandler,
);

export default router;
