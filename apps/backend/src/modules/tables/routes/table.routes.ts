import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import {
  createTable,
  disableTable,
  getTable,
  getTableQr,
  listTables,
  updateTable,
} from "../controllers/table.controller.js";
import { createTableSchema } from "../schemas/create-table.schema.js";
import { updateTableSchema } from "../schemas/update-table.schema.js";

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
  listTables as RequestHandler,
);
router.get(
  "/:id/qr",
  authMiddleware(),
  requireRole(...readRoles),
  validate(idParamSchema(), "params"),
  getTableQr as RequestHandler,
);
router.get(
  "/:id",
  authMiddleware(),
  requireRole(...readRoles),
  validate(idParamSchema(), "params"),
  getTable as RequestHandler,
);
router.post(
  "/",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(createTableSchema, "body"),
  createTable as RequestHandler,
);
router.patch(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  validate(updateTableSchema, "body"),
  updateTable as RequestHandler,
);
router.delete(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  disableTable as RequestHandler,
);

export default router;
