import { z } from "zod";
import { couponCodeSchema } from "./create-coupon.schema.js";

export const updateCouponSchema = z
  .object({
    code: couponCodeSchema.optional(),
    discountType: z.enum(["PERCENT", "FIXED"]).optional(),
    value: z.coerce.number().positive("Value must be positive").optional(),
    expiresAt: z.coerce.date().optional().nullable(),
    maxUses: z.coerce.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.discountType === "PERCENT" &&
      data.value !== undefined &&
      data.value > 100
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percent value must be at most 100",
      });
    }
  });

export type UpdateCouponDTO = z.infer<typeof updateCouponSchema>;
