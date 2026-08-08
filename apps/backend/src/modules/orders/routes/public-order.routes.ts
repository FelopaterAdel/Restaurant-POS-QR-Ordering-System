import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "../../../middleware/validate.middleware.js";
import { createOrder } from "../controllers/public-order.controller.js";
import { createOrderSchema } from "../schemas/create-order.schema.js";

const router = Router();

router.post(
  "/",
  validate(createOrderSchema, "body"),
  createOrder as RequestHandler,
);

export default router;
