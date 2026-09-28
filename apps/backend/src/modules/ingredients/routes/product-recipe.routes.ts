import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import {
  getProductRecipe,
  setProductRecipe,
} from "../controllers/ingredient.controller.js";
import { setRecipeSchema } from "../schemas/set-recipe.schema.js";

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
  "/:id/recipe",
  authMiddleware(),
  requireRole(...readRoles),
  validate(idParamSchema(), "params"),
  getProductRecipe as RequestHandler,
);
router.put(
  "/:id/recipe",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  validate(setRecipeSchema, "body"),
  setProductRecipe as RequestHandler,
);

export default router;
