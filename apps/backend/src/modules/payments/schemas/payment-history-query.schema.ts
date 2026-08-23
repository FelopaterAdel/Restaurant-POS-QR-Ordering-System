import { z } from "zod";
import { isValidDate } from "../../../utils/date.js";

const dateParam = z
  .string()
  .refine(isValidDate, "Date must be in YYYY-MM-DD format");

const orderNumberParam = z.coerce
  .number()
  .int("Order number must be an integer")
  .positive("Order number must be a positive number");

const dateRangeRefinement = {
  message: "From date must not be after to date",
  path: ["from"],
};

export const paymentHistoryQuerySchema = z
  .object({
    from: dateParam.optional(),
    to: dateParam.optional(),
    orderNumber: orderNumberParam.optional(),
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
  })
  .refine(
    (data) => !data.from || !data.to || data.from <= data.to,
    dateRangeRefinement,
  );

export const paymentSummaryQuerySchema = z
  .object({
    from: dateParam.optional(),
    to: dateParam.optional(),
    orderNumber: orderNumberParam.optional(),
  })
  .refine(
    (data) => !data.from || !data.to || data.from <= data.to,
    dateRangeRefinement,
  );

export type PaymentHistoryQueryDTO = z.infer<typeof paymentHistoryQuerySchema>;
export type PaymentHistoryQueryInput = z.input<typeof paymentHistoryQuerySchema>;
export type PaymentSummaryQueryDTO = z.infer<typeof paymentSummaryQuerySchema>;
