import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import {
  deleteUser,
  listUsers,
} from "../controllers/users.controller.js";

const router = Router();

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
  deleteUser as RequestHandler,
);

export default router;
