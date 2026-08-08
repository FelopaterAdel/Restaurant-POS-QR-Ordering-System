import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "../../../middleware/validate.middleware.js";
import { getPublicMenu } from "../controllers/public-menu.controller.js";
import { tableIdSchema } from "../schemas/table-id.schema.js";

const router = Router();

router.get(
  "/:tableId",
  validate(tableIdSchema, "params"),
  getPublicMenu as RequestHandler,
);

export default router;
