import { z } from "zod";

export const updateTableSchema = z.object({
  number: z
    .number()
    .int("Table number must be an integer")
    .positive("Table number must be a positive number")
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .optional(),
});

export type UpdateTableDTO = z.infer<typeof updateTableSchema>;
export type UpdateTableInput = z.input<typeof updateTableSchema>;
