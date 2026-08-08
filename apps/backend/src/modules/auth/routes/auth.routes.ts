import { Router } from "express";
import { validate } from "../../../middleware/validate.middleware.js";
import {
  login,
  logout,
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

export default router;
