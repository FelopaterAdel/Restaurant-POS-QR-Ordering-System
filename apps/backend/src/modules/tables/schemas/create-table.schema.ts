import { z } from "zod";

export const createTableSchema = z.object({
  number: z
    .number()
    .int("Table number must be an integer")
    .positive("Table number must be a positive number"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
});

export type CreateTableDTO = z.infer<typeof createTableSchema>;
export type CreateTableInput = z.input<typeof createTableSchema>;
