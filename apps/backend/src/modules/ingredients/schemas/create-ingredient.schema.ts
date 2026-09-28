import { z } from "zod";

export const createIngredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(20, "Unit must be at most 20 characters"),
  quantityInStock: z.coerce.number().min(0).default(0),
  lowStockThreshold: z.coerce.number().min(0).default(0),
});

export type CreateIngredientDTO = z.infer<typeof createIngredientSchema>;
export type CreateIngredientInput = z.input<typeof createIngredientSchema>;
