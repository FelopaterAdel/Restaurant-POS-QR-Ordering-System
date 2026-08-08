import { z } from "zod";
import { OrderStatus } from "@restaurant/database";

const orderStatusValues = Object.values(OrderStatus) as [
  (typeof OrderStatus)[keyof typeof OrderStatus],
  ...(typeof OrderStatus)[keyof typeof OrderStatus][],
];

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatusValues, "Status is required"),
});

export type UpdateOrderStatusDTO = z.infer<typeof updateOrderStatusSchema>;
export type UpdateOrderStatusInput = z.input<typeof updateOrderStatusSchema>;
