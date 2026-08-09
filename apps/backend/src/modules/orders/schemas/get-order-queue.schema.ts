import { z } from "zod";
import { OrderStatus } from "@restaurant/database";

export const ACTIVE_ORDER_QUEUE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
] as const;

export const getOrderQueueSchema = z.object({
  status: z
    .enum(
      ACTIVE_ORDER_QUEUE_STATUSES,
      "Status must be one of the active order statuses",
    )
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

export type GetOrderQueueDTO = z.infer<typeof getOrderQueueSchema>;
export type GetOrderQueueInput = z.input<typeof getOrderQueueSchema>;
