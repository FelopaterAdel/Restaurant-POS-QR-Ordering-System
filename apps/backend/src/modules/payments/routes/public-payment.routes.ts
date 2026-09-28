import { Router } from "express";
import type { RequestHandler } from "express";
import { listPaymentProviders } from "../controllers/providers.controller.js";

const router = Router();

router.get("/", listPaymentProviders as RequestHandler);

export default router;
