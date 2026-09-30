import { z } from "zod";
import { PaymentMethod } from "@restaurant/database";

const paymentMethodValues = Object.values(PaymentMethod) as [
  (typeof PaymentMethod)[keyof typeof PaymentMethod],
  ...(typeof PaymentMethod)[keyof typeof PaymentMethod][],
];

export const createPaymentSchema = z
  .object({
    method: z.enum(paymentMethodValues, "Payment method is required"),
    amount: z.coerce
      .number()
      .positive("Amount must be positive")
      .optional(),
    tipAmount: z.coerce.number().min(0, "Tip must not be negative").optional(),
    tipPercent: z.coerce
      .number()
      .min(0, "Tip percent must not be negative")
      .max(100, "Tip percent must be at most 100")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipAmount !== undefined && data.tipPercent !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["tipPercent"],
        message: "Provide either tipAmount or tipPercent, not both",
      });
    }
  });

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
export type CreatePaymentInput = z.input<typeof createPaymentSchema>;
