import { z } from "zod";

const createOrderItemSchema = z.object({
  productId: z.string().trim().min(1, "Product id is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be a positive number"),
});

export const customerPhoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number looks too short")
  .max(20, "Phone number must be at most 20 characters")
  .regex(
    /^[+]?[0-9][0-9\s-]*$/,
    "Phone number may only contain digits, spaces, dashes and a leading +",
  );

export const createOrderSchema = z.object({
  tableId: z.string().trim().min(1, "Table id is required"),
  items: z.array(createOrderItemSchema).min(1, "At least one item is required"),
  couponCode: z
    .string()
    .trim()
    .min(1, "Coupon code must not be empty")
    .max(32, "Coupon code must be at most 32 characters")
    .optional(),
  customerPhone: customerPhoneSchema.optional(),
  payOnline: z.boolean().optional(),
  onlineProvider: z.enum(["stripe", "paymob"]).optional(),
});

export type CreateOrderDTO = z.infer<typeof createOrderSchema>;
export type CreateOrderInput = z.input<typeof createOrderSchema>;
