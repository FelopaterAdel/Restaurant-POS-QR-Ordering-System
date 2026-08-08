import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  categoryId: z.string().min(1, "Category is required"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .nullable(),
  price: z.number().positive("Price must be a positive number"),
  imageUrl: z
    .string()
    .trim()
    .max(2048, "Image URL must be at most 2048 characters")
    .optional()
    .nullable(),
});

export type CreateProductDTO = z.infer<typeof createProductSchema>;
export type CreateProductInput = z.input<typeof createProductSchema>;
