import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "../../../middleware/validate.middleware.js";
import { getPublicMenu } from "../controllers/public-menu.controller.js";
import { qrCodeSchema } from "../schemas/qr-code.schema.js";

const router = Router();

router.get(
  "/:qrCode/menu",
  validate(qrCodeSchema, "params"),
  getPublicMenu as RequestHandler,
);

export default router;
