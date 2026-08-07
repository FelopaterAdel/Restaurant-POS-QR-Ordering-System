import { Router } from "express";
import { validate } from "../../../middleware/validate.middleware.js";
import { register } from "../controllers/auth.controller.js";
import { registerSchema } from "../schemas/register.schema.js";

const router = Router();

router.post("/register", validate(registerSchema, "body"), register);

export default router;
