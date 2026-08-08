import { z } from "zod";
import { PaymentMethod } from "@restaurant/database";

const paymentMethodValues = Object.values(PaymentMethod) as [
  (typeof PaymentMethod)[keyof typeof PaymentMethod],
  ...(typeof PaymentMethod)[keyof typeof PaymentMethod][],
];

export const createPaymentSchema = z.object({
  method: z.enum(paymentMethodValues, "Payment method is required"),
});

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
export type CreatePaymentInput = z.input<typeof createPaymentSchema>;
