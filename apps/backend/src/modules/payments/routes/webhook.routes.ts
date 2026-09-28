import { Router } from "express";
import type { RequestHandler } from "express";
import { paymobCallback } from "../controllers/webhook.controller.js";

const router = Router();

// Mounted under /api/v1/payments/webhook/paymob (after express.json()).
// Paymob signs field values with HMAC, so the parsed JSON body is enough.
router.post("/", paymobCallback as RequestHandler);

export default router;
