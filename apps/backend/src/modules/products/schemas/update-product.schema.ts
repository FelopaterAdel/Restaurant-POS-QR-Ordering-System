import { z } from "zod";

export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  price: z.number().positive("Price must be a positive number").optional(),
  imageUrl: z
    .string()
    .trim()
    .max(2048, "Image URL must be at most 2048 characters")
    .optional()
    .nullable(),
  isAvailable: z.boolean().optional(),
});

export type UpdateProductDTO = z.infer<typeof updateProductSchema>;
export type UpdateProductInput = z.input<typeof updateProductSchema>;
