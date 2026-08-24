import { z } from "zod";
import { isValidDate } from "../../../utils/date.js";

const dateString = z
  .string()
  .refine(isValidDate, "Date must be in YYYY-MM-DD format");

export const dashboardQuerySchema = z
  .object({
    date: dateString.optional(),
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

export type DashboardQueryDTO = z.infer<typeof dashboardQuerySchema>;
