import { Router } from "express";
import { validate } from "../../../middleware/validate.middleware.js";
import { login, register } from "../controllers/auth.controller.js";
import { loginSchema } from "../schemas/login.schema.js";
import { registerSchema } from "../schemas/register.schema.js";

const router = Router();

router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", validate(loginSchema, "body"), login);

export default router;
