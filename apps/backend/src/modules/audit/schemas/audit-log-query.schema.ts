import { z } from "zod";
import { isValidDate } from "../../../utils/date.js";

export const auditLogQuerySchema = z.object({
  userId: z.string().trim().min(1).optional(),
  action: z
    .enum([
      "REFUND_REQUESTED",
      "REFUND_APPROVED",
      "REFUND_REJECTED",
      "PAYMENT_VOIDED",
      "DISCOUNT_APPLIED",
      "STOCK_ADJUSTED",
      "ORDER_CANCELLED",
    ])
    .optional(),
  from: z
    .string()
    .refine(isValidDate, "from must be in YYYY-MM-DD format")
    .optional(),
  to: z
    .string()
    .refine(isValidDate, "to must be in YYYY-MM-DD format")
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AuditLogQueryDTO = z.infer<typeof auditLogQuerySchema>;
