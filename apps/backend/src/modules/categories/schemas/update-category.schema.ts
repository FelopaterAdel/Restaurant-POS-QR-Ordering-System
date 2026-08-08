import { z } from "zod";

export const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;
export type UpdateCategoryInput = z.input<typeof updateCategorySchema>;
