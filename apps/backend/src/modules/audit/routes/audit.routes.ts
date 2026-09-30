import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { listAuditLog } from "../controllers/audit.controller.js";
import { auditLogQuerySchema } from "../schemas/audit-log-query.schema.js";

const router = Router();

const auditRoles = [UserRole.OWNER, UserRole.MANAGER];

router.get(
  "/",
  authMiddleware(),
  requireRole(...auditRoles),
  validate(auditLogQuerySchema, "query"),
  listAuditLog as RequestHandler,
);

export default router;
