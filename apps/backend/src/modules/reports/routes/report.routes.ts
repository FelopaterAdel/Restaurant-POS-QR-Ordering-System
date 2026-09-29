import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  generateReport,
  getLatestReport,
  listReports,
} from "../controllers/report.controller.js";
import { generateReportSchema } from "../schemas/generate-report.schema.js";

const router = Router();

const reportRoles = [UserRole.OWNER, UserRole.MANAGER];

router.get(
  "/",
  authMiddleware(),
  requireRole(...reportRoles),
  listReports as RequestHandler,
);
router.get(
  "/latest",
  authMiddleware(),
  requireRole(...reportRoles),
  getLatestReport as RequestHandler,
);
router.post(
  "/generate",
  authMiddleware(),
  requireRole(...reportRoles),
  validate(generateReportSchema, "body"),
  generateReport as RequestHandler,
);

export default router;
