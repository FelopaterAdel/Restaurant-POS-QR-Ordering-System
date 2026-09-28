import { z } from "zod";

export const couponCodeSchema = z
  .string()
  .trim()
  .min(1, "Code is required")
  .max(32, "Code must be at most 32 characters");

export const createCouponSchema = z
  .object({
    code: couponCodeSchema,
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().positive("Value must be positive"),
    expiresAt: z.coerce.date().optional().nullable(),
    maxUses: z.coerce.number().int().positive().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "PERCENT" && data.value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percent value must be at most 100",
      });
    }
  });

export type CreateCouponDTO = z.infer<typeof createCouponSchema>;
export type CreateCouponInput = z.input<typeof createCouponSchema>;

export const validateCouponQuerySchema = z.object({
  code: couponCodeSchema,
});

export type ValidateCouponQuery = z.infer<typeof validateCouponQuerySchema>;
