import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import {
  createCoupon,
  disableCoupon,
  getCoupon,
  listCoupons,
  updateCoupon,
  validateCoupon,
} from "../controllers/coupon.controller.js";
import {
  createCouponSchema,
  validateCouponQuerySchema,
} from "../schemas/create-coupon.schema.js";
import { updateCouponSchema } from "../schemas/update-coupon.schema.js";

const router = Router();

const readRoles = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
];

const writeRoles = [UserRole.OWNER, UserRole.MANAGER];

router.get(
  "/",
  authMiddleware(),
  requireRole(...readRoles),
  listCoupons as RequestHandler,
);
router.get(
  "/validate",
  authMiddleware(),
  requireRole(...readRoles),
  validate(validateCouponQuerySchema, "query"),
  validateCoupon as RequestHandler,
);
router.get(
  "/:id",
  authMiddleware(),
  requireRole(...readRoles),
  validate(idParamSchema(), "params"),
  getCoupon as RequestHandler,
);
router.post(
  "/",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(createCouponSchema, "body"),
  createCoupon as RequestHandler,
);
router.patch(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  validate(updateCouponSchema, "body"),
  updateCoupon as RequestHandler,
);
router.delete(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  disableCoupon as RequestHandler,
);

export default router;
