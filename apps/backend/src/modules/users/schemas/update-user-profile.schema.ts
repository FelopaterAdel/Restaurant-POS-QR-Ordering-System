import { z } from "zod";
import { UserRole } from "@restaurant/database";

export const staffRoleSchema = z.enum([
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
]);

export const updateUserProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters"),
  role: staffRoleSchema,
});

export type UpdateUserProfileDTO = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserProfileInput = z.input<typeof updateUserProfileSchema>;
