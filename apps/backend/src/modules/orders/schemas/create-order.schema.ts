import { z } from "zod";

const createOrderItemSchema = z.object({
  productId: z.string().trim().min(1, "Product id is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be a positive number"),
});

export const createOrderSchema = z.object({
  tableId: z.string().trim().min(1, "Table id is required"),
  items: z.array(createOrderItemSchema).min(1, "At least one item is required"),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type CreateOrderInput = z.input<typeof createOrderSchema>;
