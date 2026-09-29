import { z } from "zod";
import { isValidDate } from "../../../utils/date.js";

const dateString = z
  .string()
  .refine(isValidDate, "Date must be in YYYY-MM-DD format");

export const analyticsRangeSchema = z
  .object({
    from: dateString.optional(),
    to: dateString.optional(),
  })
  .refine(
    (query) => !(query.from && query.to && query.from > query.to),
    "`from` date must not be after `to` date",
  )
  .refine(
    (query) => !((query.from && !query.to) || (!query.from && query.to)),
    "`from` and `to` must be provided together",
  );

export const topProductsQuerySchema = analyticsRangeSchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const revenueTrendQuerySchema = analyticsRangeSchema.extend({
  granularity: z.enum(["day", "week", "month"]).default("day"),
});

export type AnalyticsRangeDTO = z.infer<typeof analyticsRangeSchema>;
export type TopProductsQueryDTO = z.infer<typeof topProductsQuerySchema>;
export type RevenueTrendQueryDTO = z.infer<typeof revenueTrendQuerySchema>;
