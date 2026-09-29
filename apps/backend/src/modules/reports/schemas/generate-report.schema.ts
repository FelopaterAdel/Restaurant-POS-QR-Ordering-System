import { z } from "zod";
import { isValidDate } from "../../../utils/date.js";

export const generateReportSchema = z.object({
  date: z
    .string()
    .refine(isValidDate, "Date must be in YYYY-MM-DD format")
    .optional(),
});

export type GenerateReportDTO = z.infer<typeof generateReportSchema>;
