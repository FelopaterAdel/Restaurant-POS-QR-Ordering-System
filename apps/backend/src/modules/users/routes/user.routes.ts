import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import {
  createUser,
  deleteUser,
  listUsers,
} from "../controllers/user.controller.js";
import { createUserSchema } from "../schemas/create-user.schema.js";

const router = Router();

router.post(
  "/",
  authMiddleware(),
  requireRole(UserRole.OWNER),
  validate(createUserSchema, "body"),
  createUser as RequestHandler,
);
router.get(
  "/",
  authMiddleware(),
  requireRole(UserRole.OWNER),
  listUsers as RequestHandler,
);
router.delete(
  "/:id",
  authMiddleware(),
  requireRole(UserRole.OWNER),
  validate(idParamSchema(), "params"),
  deleteUser as RequestHandler,
);

export default router;
