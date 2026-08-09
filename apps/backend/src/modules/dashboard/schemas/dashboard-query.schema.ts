import { z } from "zod";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const dashboardQuerySchema = z.object({
  date: z
    .string()
    .refine(isValidDate, "Date must be in YYYY-MM-DD format")
    .optional(),
});

export type DashboardQueryDTO = z.infer<typeof dashboardQuerySchema>;
