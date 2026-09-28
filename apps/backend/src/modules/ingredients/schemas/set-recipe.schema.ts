import { z } from "zod";

export const setRecipeSchema = z.object({
  items: z
    .array(
      z.object({
        ingredientId: z.string().min(1, "ingredientId is required"),
        quantityUsed: z.coerce.number().positive("quantityUsed must be positive"),
      }),
    )
    .max(100, "Recipe must have at most 100 items"),
});

export type SetRecipeDTO = z.infer<typeof setRecipeSchema>;
