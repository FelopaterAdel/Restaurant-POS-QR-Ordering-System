import { z } from "zod";
import { isValidDate } from "../../../utils/date.js";

export const reservationQuerySchema = z.object({
  date: z
    .string()
    .refine(isValidDate, "Date must be in YYYY-MM-DD format")
    .optional(),
  status: z
    .enum(["PENDING", "CONFIRMED", "SEATED", "CANCELLED", "COMPLETED"])
    .optional(),
});

export type ReservationQueryDTO = z.infer<typeof reservationQuerySchema>;
