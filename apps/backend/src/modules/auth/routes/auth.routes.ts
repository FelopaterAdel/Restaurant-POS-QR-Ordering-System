import { Router } from "express";
import type { RequestHandler } from "express";
import { env } from "../../../config/env.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { rateLimiter } from "../../../middleware/rate-limit.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  bootstrapOwner,
  login,
  logout,
  me,
  refresh,
} from "../controllers/auth.controller.js";
import { bootstrapOwnerSchema } from "../schemas/bootstrap-owner.schema.js";
import { loginSchema } from "../schemas/login.schema.js";
import { refreshTokenSchema } from "../schemas/refresh-token.schema.js";

const router = Router();

const loginRateLimiter = rateLimiter({
  windowMs: env.authRateLimit.windowMs,
  limit: env.authRateLimit.loginMax,
});

const refreshRateLimiter = rateLimiter({
  windowMs: env.authRateLimit.windowMs,
  limit: env.authRateLimit.refreshMax,
});

router.post(
  "/bootstrap/owner",
  validate(bootstrapOwnerSchema, "body"),
  bootstrapOwner,
);
router.post("/login", loginRateLimiter, validate(loginSchema, "body"), login);
router.post(
  "/refresh",
  refreshRateLimiter,
  validate(refreshTokenSchema, "body"),
  refresh,
);
router.post("/logout", validate(refreshTokenSchema, "body"), logout);
router.get("/me", authMiddleware(), me as RequestHandler);

export default router;
