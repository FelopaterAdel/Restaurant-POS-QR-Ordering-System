import { z } from "zod";

export const cancelOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Reason must not exceed 500 characters")
    .optional(),
});

export type CancelOrderDTO = z.infer<typeof cancelOrderSchema>;
export type CancelOrderInput = z.input<typeof cancelOrderSchema>;
