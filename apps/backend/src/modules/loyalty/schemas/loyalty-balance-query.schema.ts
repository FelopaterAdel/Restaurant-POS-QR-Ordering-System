import { z } from "zod";

export const loyaltyBalanceQuerySchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .max(20, "Phone must be at most 20 characters"),
});

export type LoyaltyBalanceQuery = z.infer<typeof loyaltyBalanceQuerySchema>;
