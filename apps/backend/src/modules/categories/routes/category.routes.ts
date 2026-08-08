import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  createCategory,
  disableCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { createCategorySchema } from "../schemas/create-category.schema.js";
import { updateCategorySchema } from "../schemas/update-category.schema.js";

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
  listCategories as RequestHandler,
);
router.get(
  "/:id",
  authMiddleware(),
  requireRole(...readRoles),
  getCategory as RequestHandler,
);
router.post(
  "/",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(createCategorySchema, "body"),
  createCategory as RequestHandler,
);
router.patch(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(updateCategorySchema, "body"),
  updateCategory as RequestHandler,
);
router.delete(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  disableCategory as RequestHandler,
);

export default router;
