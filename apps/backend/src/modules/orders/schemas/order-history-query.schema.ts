import { z } from "zod";
import { OrderStatus } from "@restaurant/database";
import { isValidDate } from "../../../utils/date.js";

export const ALL_ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
] as const;

export const orderHistoryQuerySchema = z.object({
  orderNumber: z.coerce
    .number()
    .int("Order number must be an integer")
    .positive("Order number must be a positive number")
    .optional(),
  status: z
    .enum(ALL_ORDER_STATUSES, "Status must be a valid order status")
    .optional(),
  date: z
    .string()
    .refine(isValidDate, "Date must be in YYYY-MM-DD format")
    .optional(),
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

export type OrderHistoryQueryDTO = z.infer<typeof orderHistoryQuerySchema>;
export type OrderHistoryQueryInput = z.input<typeof orderHistoryQuerySchema>;
