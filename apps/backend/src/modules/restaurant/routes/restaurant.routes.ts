import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  getRestaurant,
  updateRestaurant,
} from "../controllers/restaurant.controller.js";
import { updateRestaurantSchema } from "../schemas/update-restaurant.schema.js";

const router = Router();

router.get(
  "/",
  authMiddleware(),
  requireRole(UserRole.OWNER, UserRole.MANAGER),
  getRestaurant as RequestHandler,
);
router.patch(
  "/",
  authMiddleware(),
  requireRole(UserRole.OWNER),
  validate(updateRestaurantSchema, "body"),
  updateRestaurant as RequestHandler,
);

export default router;
