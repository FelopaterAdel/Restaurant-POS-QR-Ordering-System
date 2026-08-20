import { z } from "zod";

export const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6})$/, "Must be a valid hex color (e.g. #059669)");

export const updateRestaurantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be at most 200 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .nullable()
    .optional(),
  phone: z
    .string()
    .trim()
    .max(30, "Phone must be at most 30 characters")
    .nullable()
    .optional(),
  address: z
    .string()
    .trim()
    .max(500, "Address must be at most 500 characters")
    .nullable()
    .optional(),
  logoUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(500, "Logo URL must be at most 500 characters")
    .nullable()
    .optional(),
  primaryColor: hexColorSchema.optional(),
  secondaryColor: hexColorSchema.nullable().optional(),
});

export type UpdateRestaurantDTO = z.infer<typeof updateRestaurantSchema>;
export type UpdateRestaurantInput = z.input<typeof updateRestaurantSchema>;
