import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password must be at most 72 characters"),
});

export type LoginDTO = z.infer<typeof loginSchema>;
export type LoginInput = z.input<typeof loginSchema>;
