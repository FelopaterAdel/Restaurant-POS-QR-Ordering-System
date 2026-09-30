import { z } from "zod";

export const reviewRefundSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, "Reason must be at most 500 characters")
    .optional()
    .nullable(),
});

export type ReviewRefundDTO = z.infer<typeof reviewRefundSchema>;
