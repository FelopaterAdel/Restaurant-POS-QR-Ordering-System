import { z } from "zod";

export const listOrdersSchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be a positive number")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be a positive number")
    .max(100, "Limit must not exceed 100")
    .default(20),
});

export type ListOrdersDTO = z.infer<typeof listOrdersSchema>;
export type ListOrdersInput = z.input<typeof listOrdersSchema>;
