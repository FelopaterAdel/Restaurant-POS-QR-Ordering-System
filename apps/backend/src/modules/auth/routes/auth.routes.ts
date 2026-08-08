import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  login,
  logout,
  me,
  refresh,
  register,
} from "../controllers/auth.controller.js";
import { loginSchema } from "../schemas/login.schema.js";
import { refreshTokenSchema } from "../schemas/refresh-token.schema.js";
import { registerSchema } from "../schemas/register.schema.js";

const router = Router();

router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", validate(loginSchema, "body"), login);
router.post("/refresh", validate(refreshTokenSchema, "body"), refresh);
router.post("/logout", validate(refreshTokenSchema, "body"), logout);
router.get("/me", authMiddleware(), me as RequestHandler);

export default router;
