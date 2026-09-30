import { z } from "zod";

export const requestRefundSchema = z.object({
  paymentId: z.string().trim().min(1, "Payment id is required"),
  amount: z.coerce.number().positive("Amount must be positive").optional(),
  reason: z
    .string()
    .trim()
    .max(500, "Reason must be at most 500 characters")
    .optional()
    .nullable(),
});

export type RequestRefundDTO = z.infer<typeof requestRefundSchema>;
export type RequestRefundInput = z.input<typeof requestRefundSchema>;
