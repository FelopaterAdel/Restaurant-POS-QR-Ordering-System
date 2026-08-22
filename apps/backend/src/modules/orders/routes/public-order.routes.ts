import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  createOrder,
  getPublicOrder,
} from "../controllers/public-order.controller.js";
import { createOrderSchema } from "../schemas/create-order.schema.js";
import {
  getPublicOrderParamsSchema,
  getPublicOrderQuerySchema,
} from "../schemas/get-public-order.schema.js";

const router = Router();

router.post(
  "/",
  validate(createOrderSchema, "body"),
  createOrder as RequestHandler,
);

router.get(
  "/:orderId",
  validate(getPublicOrderParamsSchema, "params"),
  validate(getPublicOrderQuerySchema, "query"),
  getPublicOrder as RequestHandler,
);

export default router;
