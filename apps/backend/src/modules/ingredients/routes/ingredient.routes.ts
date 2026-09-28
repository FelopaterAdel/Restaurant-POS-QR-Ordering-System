import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import {
  createIngredient,
  disableIngredient,
  getIngredient,
  listIngredients,
  listLowStockIngredients,
  updateIngredient,
} from "../controllers/ingredient.controller.js";
import { createIngredientSchema } from "../schemas/create-ingredient.schema.js";
import { updateIngredientSchema } from "../schemas/update-ingredient.schema.js";

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
  listIngredients as RequestHandler,
);
router.get(
  "/low-stock",
  authMiddleware(),
  requireRole(...readRoles),
  listLowStockIngredients as RequestHandler,
);
router.get(
  "/:id",
  authMiddleware(),
  requireRole(...readRoles),
  validate(idParamSchema(), "params"),
  getIngredient as RequestHandler,
);
router.post(
  "/",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(createIngredientSchema, "body"),
  createIngredient as RequestHandler,
);
router.patch(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  validate(updateIngredientSchema, "body"),
  updateIngredient as RequestHandler,
);
router.delete(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  disableIngredient as RequestHandler,
);

export default router;
