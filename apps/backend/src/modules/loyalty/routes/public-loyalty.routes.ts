import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "../../../middleware/validate.middleware.js";
import { getLoyaltyBalance } from "../controllers/loyalty.controller.js";
import { loyaltyBalanceQuerySchema } from "../schemas/loyalty-balance-query.schema.js";

const router = Router();

router.get(
  "/",
  validate(loyaltyBalanceQuerySchema, "query"),
  getLoyaltyBalance as RequestHandler,
);

export default router;
