import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type CreateCategoryInput = z.input<typeof createCategorySchema>;
