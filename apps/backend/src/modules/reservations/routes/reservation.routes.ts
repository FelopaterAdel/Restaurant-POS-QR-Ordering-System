import { Router } from "express";
import type { RequestHandler } from "express";
import { UserRole } from "@restaurant/database";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRole } from "../../../middleware/role.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { idParamSchema } from "../../../schemas/id-param.schema.js";
import {
  cancelReservation,
  createReservation,
  getReservation,
  listReservations,
  updateReservation,
  updateReservationStatus,
} from "../controllers/reservation.controller.js";
import { createReservationSchema } from "../schemas/create-reservation.schema.js";
import { reservationQuerySchema } from "../schemas/reservation-query.schema.js";
import { updateReservationSchema } from "../schemas/update-reservation.schema.js";
import { updateReservationStatusSchema } from "../schemas/update-reservation-status.schema.js";

const router = Router();

const readRoles = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
];

const writeRoles = [
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
];

router.get(
  "/",
  authMiddleware(),
  requireRole(...readRoles),
  validate(reservationQuerySchema, "query"),
  listReservations as RequestHandler,
);
router.get(
  "/:id",
  authMiddleware(),
  requireRole(...readRoles),
  validate(idParamSchema(), "params"),
  getReservation as RequestHandler,
);
router.post(
  "/",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(createReservationSchema, "body"),
  createReservation as RequestHandler,
);
router.patch(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  validate(updateReservationSchema, "body"),
  updateReservation as RequestHandler,
);
router.patch(
  "/:id/status",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  validate(updateReservationStatusSchema, "body"),
  updateReservationStatus as RequestHandler,
);
router.delete(
  "/:id",
  authMiddleware(),
  requireRole(...writeRoles),
  validate(idParamSchema(), "params"),
  cancelReservation as RequestHandler,
);

export default router;
