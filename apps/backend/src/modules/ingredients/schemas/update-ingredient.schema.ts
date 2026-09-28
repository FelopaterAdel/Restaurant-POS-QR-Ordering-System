import { z } from "zod";

export const updateIngredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(20, "Unit must be at most 20 characters")
    .optional(),
  quantityInStock: z.coerce.number().min(0).optional(),
  lowStockThreshold: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateIngredientDTO = z.infer<typeof updateIngredientSchema>;
