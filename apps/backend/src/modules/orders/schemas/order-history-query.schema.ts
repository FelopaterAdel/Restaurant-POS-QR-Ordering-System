import { z } from "zod";
import { OrderStatus } from "@restaurant/database";

export const ALL_ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
] as const;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

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
